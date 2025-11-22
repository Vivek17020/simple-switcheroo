import { useState } from 'react';
import { JobFilters as JobFiltersType } from '@/types/jobs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useEffect } from 'react';

interface JobFiltersProps {
  filters: JobFiltersType;
  onFilterChange: (filters: JobFiltersType) => void;
  totalResults?: number;
}

const EXPERIENCE_OPTIONS = [
  { value: 'all', label: 'All Experience' },
  { value: 'Fresher', label: 'Fresher' },
  { value: '0-1', label: '0-1 Years' },
  { value: '1-3', label: '1-3 Years' },
  { value: '3-5', label: '3-5 Years' },
  { value: '5+', label: '5+ Years' },
];

const JOB_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Contract', label: 'Contract' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'salary_desc', label: 'Highest Salary' },
  { value: 'salary_asc', label: 'Lowest Salary' },
];

export function JobFilters({ filters, onFilterChange, totalResults }: JobFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.q || '');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      onFilterChange({ ...filters, q: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  const handleExperienceChange = (value: string) => {
    onFilterChange({
      ...filters,
      experience: value === 'all' ? undefined : value,
    });
  };

  const handleJobTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      jobType: value === 'all' ? undefined : value,
    });
  };

  const handleSortChange = (value: string) => {
    onFilterChange({
      ...filters,
      sort: value as JobFiltersType['sort'],
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      location: e.target.value || undefined,
    });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      company: e.target.value || undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    onFilterChange({});
  };

  const hasActiveFilters =
    filters.q ||
    filters.experience ||
    filters.location ||
    filters.company ||
    filters.jobType;

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by job title, skills, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Experience Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Experience</Label>
          <Select
            value={filters.experience || 'all'}
            onValueChange={handleExperienceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Location</Label>
          <Input
            type="text"
            placeholder="e.g., Bangalore"
            value={filters.location || ''}
            onChange={handleLocationChange}
          />
        </div>

        {/* Company Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Company</Label>
          <Input
            type="text"
            placeholder="e.g., Infosys"
            value={filters.company || ''}
            onChange={handleCompanyChange}
          />
        </div>

        {/* Job Type Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Job Type</Label>
          <Select
            value={filters.jobType || 'all'}
            onValueChange={handleJobTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sort By</Label>
          <Select
            value={filters.sort || 'newest'}
            onValueChange={handleSortChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count & Clear Filters */}
      <div className="flex items-center justify-between">
        {totalResults !== undefined && (
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{totalResults}</span>{' '}
            jobs
          </p>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1.5"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
