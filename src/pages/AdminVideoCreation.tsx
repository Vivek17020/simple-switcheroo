import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, Plus, X, Play, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Scene {
  id: string;
  text: string;
  imageFile: File | null;
  imagePreview: string | null;
}

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];

export default function AdminVideoCreation() {
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const splitScriptIntoScenes = () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script first",
        variant: "destructive",
      });
      return;
    }

    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const newScenes: Scene[] = sentences.map((sentence, index) => ({
      id: `scene-${index}`,
      text: sentence.trim(),
      imageFile: null,
      imagePreview: null,
    }));

    setScenes(newScenes);
    toast({
      title: "Scenes Created",
      description: `Created ${newScenes.length} scenes from your script`,
    });
  };

  const handleImageUpload = (sceneId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload only image files",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setScenes(prevScenes =>
        prevScenes.map(scene =>
          scene.id === sceneId
            ? { ...scene, imageFile: file, imagePreview: e.target?.result as string }
            : scene
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const removeScene = (sceneId: string) => {
    setScenes(prevScenes => prevScenes.filter(scene => scene.id !== sceneId));
  };

  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      text: '',
      imageFile: null,
      imagePreview: null,
    };
    setScenes(prevScenes => [...prevScenes, newScene]);
  };

  const updateSceneText = (sceneId: string, text: string) => {
    setScenes(prevScenes =>
      prevScenes.map(scene =>
        scene.id === sceneId ? { ...scene, text } : scene
      )
    );
  };

  const generateVideo = async () => {
    if (!selectedVoice) {
      toast({
        title: "Error",
        description: "Please select a voice",
        variant: "destructive",
      });
      return;
    }

    if (scenes.length === 0) {
      toast({
        title: "Error",
        description: "Please create scenes first",
        variant: "destructive",
      });
      return;
    }

    const incompleteScenesCount = scenes.filter(scene => !scene.text.trim() || !scene.imageFile).length;
    if (incompleteScenesCount > 0) {
      toast({
        title: "Error",
        description: `${incompleteScenesCount} scenes are missing text or images`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      
      for (const scene of scenes) {
        if (scene.imageFile) {
          const fileName = `video-scenes/${Date.now()}-${scene.id}-${scene.imageFile.name}`;
          
          const { data, error } = await supabase.storage
            .from('article-images')
            .upload(fileName, scene.imageFile);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(data.path);

          imageUrls.push(publicUrl);
        }
      }

      // Prepare video data
      const videoData = {
        voice: selectedVoice,
        scenes: scenes.map((scene, index) => ({
          text: scene.text,
          imageUrl: imageUrls[index],
        })),
      };

      // Call video generation edge function
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: videoData,
      });

      if (error) throw error;

      toast({
        title: "Video Generation Started",
        description: "Your video is being generated. This may take a few minutes.",
      });

      // You can add logic here to track the video generation progress
      console.log('Video generation response:', data);

    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Video className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Creation</h1>
          <p className="text-muted-foreground">Create videos with AI voice and custom images</p>
        </div>
      </div>

      {/* Script Input */}
      <Card>
        <CardHeader>
          <CardTitle>Script</CardTitle>
          <CardDescription>
            Enter your script. It will be automatically split into scenes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your video script here..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[150px]"
          />
          <Button onClick={splitScriptIntoScenes} disabled={!script.trim()}>
            Split into Scenes
          </Button>
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Selection</CardTitle>
          <CardDescription>
            Choose a voice for your video narration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  {voice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Scenes */}
      {scenes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Scenes ({scenes.length})
              <Button onClick={addScene} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Scene
              </Button>
            </CardTitle>
            <CardDescription>
              Upload images and edit text for each scene.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {scenes.map((scene, index) => (
              <div key={scene.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Scene {index + 1}</h3>
                  <Button
                    onClick={() => removeScene(scene.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`scene-text-${scene.id}`}>Scene Text</Label>
                    <Textarea
                      id={`scene-text-${scene.id}`}
                      value={scene.text}
                      onChange={(e) => updateSceneText(scene.id, e.target.value)}
                      placeholder="Enter text for this scene..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`scene-image-${scene.id}`}>Scene Image</Label>
                    <div className="mt-1 space-y-4">
                      <Input
                        id={`scene-image-${scene.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(scene.id, file);
                          }
                        }}
                      />
                      
                      {scene.imagePreview && (
                        <div className="relative">
                          <img
                            src={scene.imagePreview}
                            alt={`Scene ${index + 1} preview`}
                            className="w-full max-w-sm h-48 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Generate Video */}
      {scenes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Video</CardTitle>
            <CardDescription>
              Create your video with the selected voice and scenes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateVideo}
              disabled={isGenerating || !selectedVoice}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}