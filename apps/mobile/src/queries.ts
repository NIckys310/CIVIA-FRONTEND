import type { ProjectInput } from '@civia/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { civia } from './api';
import { useSession } from './session';

const orgHeader = (org: string | null) => ({ 'X-Organization-Id': org ?? '' });

export function useProjects() {
  const org = useSession((s) => s.organizationId);
  return useQuery({
    queryKey: ['projects', org],
    enabled: !!org,
    queryFn: () => civia.unwrap(civia.api.GET('/api/v1/projects', { params: { header: orgHeader(org) } })),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const org = useSession((s) => s.organizationId);
  return useMutation({
    mutationFn: (body: ProjectInput) =>
      civia.unwrap(civia.api.POST('/api/v1/projects', { body, params: { header: orgHeader(org) } })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => civia.unwrap(civia.api.GET('/api/v1/auth/sessions')),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      civia.unwrap(civia.api.DELETE('/api/v1/auth/sessions/{session_id}', { params: { path: { session_id: id } } })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
