import api, { ApiResponse } from './api';

// Link interfaces
export interface Link {
  id: number;
  slug: string;
  target_url: string;
  created_at: string;
  expires_at?: string | null;
  click_limit?: number | null;
  click_count: number;
  deleted_at?: string | null;
  user_id?: number | null;
}

// Link request interfaces
export interface CreateLinkRequest {
  target_url: string;
  expires_at?: string | null;
  click_limit?: number | null;
}

// Link service class
class LinkService {  /**
   * Create a new shortened link
   * @param linkData - Link creation data
   * @returns Promise with created link data
   */
  async createLink(linkData: CreateLinkRequest): Promise<Link> {
    try {
      const response = await api.post<{ link: Link, message: string }>('/links', linkData);
      return response.data.link;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create link';
      throw new Error(errorMessage);
    }
  }
  /**
   * Get all links for the authenticated user
   * @returns Promise with array of links
   */
  async getLinks(): Promise<Link[]> {
    try {
      const response = await api.get<{ links: Link[], message: string, count: number }>('/links');
      return response.data.links || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch links';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a link by its slug
   * @param slug - The unique slug of the link to delete
   * @returns Promise with success message
   */
  async deleteLink(slug: string): Promise<void> {
    try {
      await api.delete(`/links/${slug}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete link';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get the link slug by link ID
   * @param linkId - The link ID to find the slug for
   * @param linksCache - Optional array of links to use as cache
   * @returns Promise with the link slug or the ID as string if not found
   */
  async getLinkSlug(linkId: number | string, linksCache?: Link[]): Promise<string> {
    try {
      // If we have a links cache, use it to find the slug
      if (linksCache && linksCache.length > 0) {
        const link = linksCache.find(l => l.id === Number(linkId));
        if (link) return link.slug;
      }
      
      // Otherwise fetch all links and find the matching one
      const links = await this.getLinks();
      const link = links.find(l => l.id === Number(linkId));
      return link ? link.slug : String(linkId);
    } catch (error) {
      // On error, just return the ID as string
      return String(linkId);
    }
  }
}

// Create and export a singleton instance
const linkService = new LinkService();
export default linkService;
