import JobDetailsClient from './JobDetailsClient';
import { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import Vacancy from '@/lib/models/Vacancy';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    await connectDB();
    const vacancy: any = await Vacancy.findById(id).lean();
    if (!vacancy) {
      return {
        title: 'Career Vacancy | Winsor Maison',
      };
    }

    const title = `${vacancy.jobTitle} — Careers at Winsor Maison`;
    const description = `${vacancy.department || 'Boutique Operations'} career opportunity: Join Winsor Maison as a ${vacancy.jobTitle} in ${vacancy.location || 'Colombo'}. ${vacancy.employmentType || 'Full-time'} position.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  } catch (err) {
    return {
      title: 'Careers & Horology Vacancies | Winsor Maison',
    };
  }
}

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  let jobJsonLd: any = null;

  try {
    await connectDB();
    const vacancy: any = await Vacancy.findById(id).lean();
    if (vacancy) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';
      jobJsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        'title': vacancy.jobTitle,
        'description': vacancy.description || `Join Winsor Maison as ${vacancy.jobTitle}`,
        'datePosted': vacancy.createdAt ? new Date(vacancy.createdAt).toISOString() : new Date().toISOString(),
        'employmentType': (vacancy.employmentType || 'FULL_TIME').toUpperCase().replace('-', '_'),
        'hiringOrganization': {
          '@type': 'Organization',
          'name': 'Winsor Maison',
          'sameAs': baseUrl,
          'logo': `${baseUrl}/icon.png`,
        },
        'jobLocation': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': vacancy.location || 'Colombo',
            'addressCountry': 'LK',
          },
        },
      };
    }
  } catch (e) {
    // Ignore fallback
  }

  return (
    <>
      {jobJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd) }}
        />
      )}
      <JobDetailsClient id={id} />
    </>
  );
}
