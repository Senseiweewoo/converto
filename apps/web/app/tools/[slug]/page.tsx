import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CONVERTO_TOOLS, getToolBySlug } from '@converto/tools';
import { ToolClientPage } from './ToolClientPage';

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CONVERTO_TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: 'Tool Not Found — Converto',
    };
  }

  return {
    title: `${tool.title} — Privately in Your Browser | Converto`,
    description: `${tool.description} 100% free, processed locally on your device with no file uploads or limits.`,
    openGraph: {
      title: `${tool.title} — Converto`,
      description: tool.description,
    },
  };
}

export default async function ToolServerPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolClientPage slug={slug} />;
}
