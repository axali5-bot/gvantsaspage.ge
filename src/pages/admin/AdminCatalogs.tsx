import CatalogManagerProject from '@/components/CatalogManagerProject';

export const AdminCatalogs = () => {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl">Catalogs</h2>
      <CatalogManagerProject />
    </div>
  );
};

export default AdminCatalogs;
