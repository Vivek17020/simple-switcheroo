import { useParams, useSearchParams } from 'react-router-dom';
import { UPSCPYQPlayer } from '@/components/upsc/UPSCPYQPlayer';
import { UPSCBreadcrumb } from '@/components/upsc/UPSCBreadcrumb';
import { Helmet } from 'react-helmet-async';

export default function UPSCPYQPractice() {
  const { articleSlug } = useParams();
  const [searchParams] = useSearchParams();
  
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
  const subject = searchParams.get('subject') || undefined;
  const examName = searchParams.get('exam') || undefined;

  const title = examName 
    ? `${examName} ${year || ''} Practice Questions`
    : 'UPSC Previous Year Questions Practice';

  return (
    <>
      <Helmet>
        <title>{title} | UPSC Briefs</title>
        <meta name="description" content={`Practice ${title} with instant feedback and detailed explanations.`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <UPSCBreadcrumb 
          items={[
            { label: 'Home', href: '/upscbriefs' },
            { label: 'Practice', href: '/upscbriefs/practice' },
            { label: 'PYQ Practice' },
          ]} 
        />

        <div className="mt-6">
          <UPSCPYQPlayer
            articleId={articleSlug}
            examName={examName}
            year={year}
            subject={subject}
            title={title}
          />
        </div>
      </div>
    </>
  );
}
