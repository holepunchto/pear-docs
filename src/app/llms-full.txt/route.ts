import { buildLlmsFull } from '@/lib/llms-full';

export const dynamic = 'force-static';
export const revalidate = false;

export const GET = () => buildLlmsFull();
