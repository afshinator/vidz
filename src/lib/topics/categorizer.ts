export const YOUTUBE_CATEGORIES = [
  { id: '1', name: 'Film & Animation' },
  { id: '2', name: 'Autos & Vehicles' },
  { id: '10', name: 'Music' },
  { id: '15', name: 'Pets & Animals' },
  { id: '17', name: 'Sports' },
  { id: '18', name: 'Short Movies' },
  { id: '19', name: 'Travel & Events' },
  { id: '20', name: 'Gaming' },
  { id: '21', name: 'Videoblogging' },
  { id: '22', name: 'People & Blogs' },
  { id: '23', name: 'Comedy' },
  { id: '24', name: 'Entertainment' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
  { id: '27', name: 'Education' },
  { id: '28', name: 'Science & Technology' },
] as const;

export type YouTubeCategoryId = (typeof YOUTUBE_CATEGORIES)[number]['id'];

export function getCategoryById(id: string): typeof YOUTUBE_CATEGORIES[number] | undefined {
  return YOUTUBE_CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryByName(name: string): typeof YOUTUBE_CATEGORIES[number] | undefined {
  const lower = name.toLowerCase();
  return YOUTUBE_CATEGORIES.find((cat) => cat.name.toLowerCase().includes(lower));
}