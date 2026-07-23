export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface Announcement {
    uuid: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    isPinned: boolean;
    createdAt: string;
    
    // Author details
    authorUuid: string;
    authorName: string;
    authorRole: string;
    authorAvatar: string | null;
}

export interface AnnouncementRequest {
    title: string;
    content: string;
    priority: AnnouncementPriority;
    isPinned: boolean;
}
