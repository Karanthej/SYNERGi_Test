import { apiClient } from '@/lib/apiClient';
import type { JobOffer, CreateJobOfferRequest } from '@/types/jobOffer';

import type { ApplicationRequest } from '@/services/talentApplicationService';

export const jobOfferService = {
  createJobOffers: async (request: CreateJobOfferRequest): Promise<JobOffer[]> => {
    const response = await apiClient.post('/job-offers', request);
    return response.data.data;
  },

  getTalentJobOffers: async (): Promise<JobOffer[]> => {
    const response = await apiClient.get('/job-offers/talent');
    return response.data.data;
  },

  getFounderJobOffers: async (): Promise<JobOffer[]> => {
    const response = await apiClient.get('/job-offers/founder');
    return response.data.data;
  },

  rejectJobOffer: async (uuid: string): Promise<void> => {
    await apiClient.post(`/job-offers/${uuid}/reject`);
  },

  applyToJobOffer: async (uuid: string, data: ApplicationRequest): Promise<void> => {
    await apiClient.post(`/job-offers/${uuid}/apply`, data);
  },

  deleteJobOffer: async (uuid: string): Promise<void> => {
    await apiClient.delete(`/job-offers/${uuid}`);
  }
};
