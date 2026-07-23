export interface JobOffer {
  uuid: string;
  status: 'PENDING' | 'REJECTED' | 'APPLIED' | 'ACCEPTED' | 'APPLICATION_REJECTED' | 'APPLICATION_WITHDRAWN';
  createdAt: string;
  updatedAt: string;
  startup: any; // Using any for brevity, can map to Startup profile
  founder: any;
  talent: any;
}

export interface CreateJobOfferRequest {
  talentUuid: string;
  startupUuids: string[];
}
