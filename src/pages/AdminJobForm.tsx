import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { JobsAPI } from '@/services/jobs-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import slugify from 'slugify';

const jobFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(5, 'Slug must be at least 5 characters'),
  company: z.string().min(2, 'Company name is required'),
  logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().min(2, 'Location is required'),
  salary: z.string().min(1, 'Salary information is required'),
  experience: z.string().min(1, 'Experience level is required'),
  jobType: z.string().min(1, 'Job type is required'),
  shortDescription: z.string().min(20, 'Short description must be at least 20 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  tags: z.string(),
  applyUrl: z.string().url('Must be a valid URL'),
  source: z.string().optional(),
  isPublished: z.boolean(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function AdminJobForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      company: '',
      logo: '',
      location: '',
      salary: '',
      experience: 'Fresher',
      jobType: 'Full-time',
      shortDescription: '',
      description: '',
      tags: '',
      applyUrl: '',
      source: 'direct',
      isPublished: false,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadJob(id);
    }
  }, [id, isEditing]);

  const loadJob = async (jobId: string) => {
    try {
      const job = await JobsAPI.getJob(jobId);
      form.reset({
        title: job.title,
        slug: job.slug,
        company: job.company,
        logo: job.logo || '',
        location: job.location,
        salary: job.salary,
        experience: job.experience,
        jobType: job.jobType,
        shortDescription: job.shortDescription,
        description: job.description,
        tags: job.tags.join(', '),
        applyUrl: job.applyUrl,
        source: job.source || 'direct',
        isPublished: job.isPublished || false,
      });
    } catch (error) {
      toast.error('Failed to load job');
      navigate('/admin/jobs');
    }
  };

  const onSubmit = async (values: JobFormValues) => {
    setIsLoading(true);
    try {
      const payload: any = {
        title: values.title,
        slug: values.slug,
        company: values.company,
        logo: values.logo || '',
        location: values.location,
        salary: values.salary,
        experience: values.experience,
        jobType: values.jobType,
        shortDescription: values.shortDescription,
        description: values.description,
        tags: values.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        applyUrl: values.applyUrl,
        source: values.source || 'direct',
        postedAt: new Date().toISOString(),
        isPublished: values.isPublished,
        recommendedScore: 0,
      };

      if (isEditing && id) {
        await JobsAPI.updateJob(id, payload);
        toast.success('Job updated successfully');
      } else {
        await JobsAPI.createJob(payload);
        toast.success('Job created successfully');
      }
      navigate('/admin/jobs');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update job' : 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    form.setValue('title', title);
    if (!isEditing) {
      const slug = slugify(title, { lower: true, strict: true });
      form.setValue('slug', slug);
    }
  };

  return (
    <div className="max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/jobs')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Jobs
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Job' : 'Create New Job'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditing ? 'Update job posting details' : 'Add a new job opportunity'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="senior-software-engineer" />
                  </FormControl>
                  <FormDescription>URL-friendly identifier</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Google" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/logo.png" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Bangalore, India" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. ₹10-15 LPA" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience Level *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Fresher">Fresher</SelectItem>
                      <SelectItem value="0-2 years">0-2 years</SelectItem>
                      <SelectItem value="2-5 years">2-5 years</SelectItem>
                      <SelectItem value="5-10 years">5-10 years</SelectItem>
                      <SelectItem value="10+ years">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder="A brief overview of the job (shown in listings)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Description *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={10}
                    placeholder="Detailed job description, responsibilities, requirements, etc."
                  />
                </FormControl>
                <FormDescription>Supports HTML formatting</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. JavaScript, React, Node.js" />
                </FormControl>
                <FormDescription>Comma-separated tags</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="applyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apply URL *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://careers.company.com/apply" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. LinkedIn, Naukri" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Publish Job</FormLabel>
                  <FormDescription>
                    Make this job visible to the public
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Job' : 'Create Job'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/jobs')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
