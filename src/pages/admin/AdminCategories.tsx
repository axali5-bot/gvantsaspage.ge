import CategoryManager from '@/components/CategoryManager';

export const AdminCategories = () => {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl">Categories</h2>
      <CategoryManager />
    </div>
  );
};

export default AdminCategories;
