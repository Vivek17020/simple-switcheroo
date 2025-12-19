import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  FileJson, 
  CheckCircle2,
  XCircle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  usePYQQuestions, 
  useCreatePYQQuestion, 
  useUpdatePYQQuestion, 
  useDeletePYQQuestion,
  useBulkCreatePYQQuestions,
  type PYQQuestion 
} from '@/hooks/use-upsc-pyq';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'assertion_reason', label: 'Assertion-Reason' },
  { value: 'match_list', label: 'Match the Following' },
  { value: 'chronological', label: 'Chronological' },
  { value: 'passage_based', label: 'Passage Based' },
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const EXAM_NAMES = [
  'UPSC CSE Prelims',
  'UPSC CSE Mains',
  'CSAT',
  'UPSC CAPF',
  'UPSC CDS',
  'UPSC NDA',
];

const SUBJECTS = [
  'General Studies',
  'CSAT',
  'History',
  'Geography',
  'Polity',
  'Economy',
  'Science & Technology',
  'Environment',
  'Current Affairs',
];

const defaultQuestion: Omit<PYQQuestion, 'id' | 'created_at' | 'updated_at'> = {
  article_id: null,
  section_title: 'General',
  question_number: 1,
  question_type: 'mcq',
  question_text: '',
  passage: null,
  options: { a: '', b: '', c: '', d: '' },
  correct_answer: null,
  explanation: null,
  additional_media: { image_urls: [], tables: [] },
  year: new Date().getFullYear(),
  exam_name: 'UPSC CSE Prelims',
  subject: 'General Studies',
  topic: null,
  difficulty: 'medium',
  is_published: false,
};

export default function AdminUPSCPYQQuestions() {
  const [activeTab, setActiveTab] = useState('list');
  const [editingQuestion, setEditingQuestion] = useState<PYQQuestion | null>(null);
  const [formData, setFormData] = useState(defaultQuestion);
  const [jsonInput, setJsonInput] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const { data: questions = [], isLoading } = usePYQQuestions();
  const createQuestion = useCreatePYQQuestion();
  const updateQuestion = useUpdatePYQQuestion();
  const deleteQuestion = useDeletePYQQuestion();
  const bulkCreate = useBulkCreatePYQQuestions();

  const filteredQuestions = questions.filter(q => {
    if (filterYear !== 'all' && q.year?.toString() !== filterYear) return false;
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
    return true;
  });

  const uniqueYears = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));

  const handleSaveQuestion = async () => {
    if (!formData.question_text || !formData.options.a) {
      toast.error('Please fill in the question text and at least option A');
      return;
    }

    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({ id: editingQuestion.id, ...formData });
        toast.success('Question updated successfully');
      } else {
        await createQuestion.mutateAsync(formData);
        toast.success('Question created successfully');
      }
      setFormData(defaultQuestion);
      setEditingQuestion(null);
      setActiveTab('list');
    } catch (error) {
      toast.error('Failed to save question');
      console.error(error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion.mutateAsync(id);
      toast.success('Question deleted');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const handleEditQuestion = (question: PYQQuestion) => {
    setEditingQuestion(question);
    setFormData({
      article_id: question.article_id,
      section_title: question.section_title,
      question_number: question.question_number,
      question_type: question.question_type,
      question_text: question.question_text,
      passage: question.passage,
      options: question.options as { a: string; b: string; c: string; d: string },
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      additional_media: question.additional_media,
      year: question.year,
      exam_name: question.exam_name,
      subject: question.subject,
      topic: question.topic,
      difficulty: question.difficulty,
      is_published: question.is_published,
    });
    setActiveTab('create');
  };

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const questionsArray = Array.isArray(parsed) ? parsed : [parsed];
      
      const formattedQuestions = questionsArray.map((q: any, idx: number) => ({
        ...defaultQuestion,
        question_text: q.question_text || '',
        question_type: q.question_type || 'mcq',
        options: q.options || { a: '', b: '', c: '', d: '' },
        correct_answer: q.correct_answer || null,
        explanation: q.explanation || null,
        passage: q.passage || null,
        question_number: idx + 1,
        year: q.year || new Date().getFullYear(),
        exam_name: q.exam_name || 'UPSC CSE Prelims',
        subject: q.subject || 'General Studies',
        topic: q.topic || null,
        difficulty: q.difficulty || 'medium',
        additional_media: q.additional_media || { image_urls: [], tables: [] },
      }));

      await bulkCreate.mutateAsync(formattedQuestions);
      toast.success(`${formattedQuestions.length} questions imported successfully`);
      setJsonInput('');
      setActiveTab('list');
    } catch (error) {
      toast.error('Invalid JSON format. Please check your input.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PYQ Questions</h1>
          <p className="text-muted-foreground">Manage Previous Year Question MCQs</p>
        </div>
        <Button onClick={() => { setEditingQuestion(null); setFormData(defaultQuestion); setActiveTab('create'); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">All Questions ({questions.length})</TabsTrigger>
          <TabsTrigger value="create">{editingQuestion ? 'Edit' : 'Create'} Question</TabsTrigger>
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year?.toString() || ''}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {SUBJECTS.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Questions Table */}
          <Card>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((q, idx) => (
                    <TableRow key={q.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {q.question_text.substring(0, 80)}...
                      </TableCell>
                      <TableCell>{q.year}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{q.subject}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          q.difficulty === 'easy' ? 'secondary' : 
                          q.difficulty === 'hard' ? 'destructive' : 'default'
                        }>
                          {q.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {q.is_published ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(q)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</CardTitle>
              <CardDescription>Fill in the question details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meta Info Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.year || ''}
                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exam</Label>
                  <Select value={formData.exam_name || ''} onValueChange={v => setFormData({ ...formData, exam_name: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_NAMES.map(exam => (
                        <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={formData.subject || ''} onValueChange={v => setFormData({ ...formData, subject: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(subj => (
                        <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={v => setFormData({ ...formData, difficulty: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={formData.section_title}
                    onChange={e => setFormData({ ...formData, section_title: e.target.value })}
                    placeholder="e.g., Mathematical Abilities"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={formData.question_type} onValueChange={v => setFormData({ ...formData, question_type: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Passage (if applicable) */}
              <div className="space-y-2">
                <Label>Passage (Optional)</Label>
                <Textarea
                  value={formData.passage || ''}
                  onChange={e => setFormData({ ...formData, passage: e.target.value || null })}
                  placeholder="Enter passage text if this is a passage-based question..."
                  rows={3}
                />
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label>Question Text *</Label>
                <Textarea
                  value={formData.question_text}
                  onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter the question..."
                  rows={4}
                />
              </div>

              {/* Options */}
              <div className="space-y-4">
                <Label>Options *</Label>
                {(['a', 'b', 'c', 'd'] as const).map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      formData.correct_answer === key 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {key.toUpperCase()}
                    </div>
                    <Input
                      className="flex-1"
                      value={formData.options[key]}
                      onChange={e => setFormData({
                        ...formData,
                        options: { ...formData.options, [key]: e.target.value }
                      })}
                      placeholder={`Option ${key.toUpperCase()}`}
                    />
                    <Button
                      type="button"
                      variant={formData.correct_answer === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, correct_answer: key })}
                    >
                      {formData.correct_answer === key ? <CheckCircle2 className="w-4 h-4" /> : 'Set Correct'}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <Label>Explanation</Label>
                <Textarea
                  value={formData.explanation || ''}
                  onChange={e => setFormData({ ...formData, explanation: e.target.value || null })}
                  placeholder="Explain why the correct answer is correct..."
                  rows={4}
                />
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label>Topic (Optional)</Label>
                <Input
                  value={formData.topic || ''}
                  onChange={e => setFormData({ ...formData, topic: e.target.value || null })}
                  placeholder="e.g., Indian Polity, Modern History"
                />
              </div>

              {/* Published */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={checked => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Published (visible to users)</Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleSaveQuestion} disabled={createQuestion.isPending || updateQuestion.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </Button>
                <Button variant="outline" onClick={() => { setActiveTab('list'); setEditingQuestion(null); setFormData(defaultQuestion); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Bulk Import via JSON
              </CardTitle>
              <CardDescription>
                Paste JSON data to import multiple questions at once. Use the AI schema format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Expected JSON Format:</p>
                <pre className="text-xs overflow-auto">
{`[
  {
    "question_type": "mcq",
    "question_text": "Your question here",
    "options": { "a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D" },
    "correct_answer": "a",
    "explanation": "Explanation text",
    "year": 2024,
    "subject": "General Studies",
    "difficulty": "medium"
  }
]`}
                </pre>
              </div>

              <Textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here..."
                rows={15}
                className="font-mono text-sm"
              />

              <Button onClick={handleBulkImport} disabled={!jsonInput.trim() || bulkCreate.isPending}>
                <Upload className="w-4 h-4 mr-2" />
                Import Questions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
