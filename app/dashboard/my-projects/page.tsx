'use client'

import ProjectList from '@/app/components/ProjectList'

export default function MyProjectsPage() {
  return <ProjectList type="my" excludeStatuses={['pending']} />
} 