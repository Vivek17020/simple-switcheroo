import { ImageMigrationDashboard } from '@/components/admin/image-migration-dashboard';

export default function AdminImageMigration() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Image Migration</h1>
        <p className="text-muted-foreground">
          Migrate existing images from Supabase Storage to Cloudinary for better performance and optimization.
        </p>
      </div>
      
      <ImageMigrationDashboard />
    </div>
  );
}
