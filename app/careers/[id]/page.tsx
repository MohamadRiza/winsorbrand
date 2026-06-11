import JobDetailsClient from './JobDetailsClient';

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <JobDetailsClient id={resolvedParams.id} />;
}
