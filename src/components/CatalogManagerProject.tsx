import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Upload, Link as LinkIcon, FileText, Save, Loader2,
  BookOpen, Trash2, AlertCircle, Eye, EyeOff, ExternalLink, Images,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Database } from '@/types/supabase';

type CatalogRow = Database['public']['Tables']['catalogs']['Row'];

interface CatalogData extends Omit<CatalogRow, 'type' | 'updated_at'> {
  type: 'link' | 'pdf' | 'flipbook';
  is_active: boolean;
  pageCount?: number;
}

const CatalogManagerProject = () => {
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<CatalogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingPages, setUploadingPages] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => { fetchCatalogs(); }, []);

  const fetchCatalogs = async () => {
    try {
      const [{ data: cats, error }, { data: pages }] = await Promise.all([
        supabase.from('catalogs').select('*'),
        supabase.from('catalog_pages').select('brand'),
      ]);
      if (error) throw error;

      const pageCounts: Record<string, number> = {};
      (pages ?? []).forEach((p) => { pageCounts[p.brand] = (pageCounts[p.brand] ?? 0) + 1; });

      setCatalogs(
        (cats ?? []).map((item) => ({
          ...item,
          type: (['link', 'pdf', 'flipbook'].includes(item.type) ? item.type : 'link') as CatalogData['type'],
          is_active: (item as any).is_active ?? true,
          pageCount: pageCounts[item.brand] ?? 0,
        }))
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (brand: string, updates: Partial<CatalogData>) => {
    setSaving(brand);
    try {
      const { error } = await supabase.from('catalogs').update(updates as any).eq('brand', brand);
      if (error) throw error;
      toast.success(`${brand.toUpperCase()} განახლდა`);
      fetchCatalogs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleFileUpload = async (brand: string, file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error('ფაილი ძალიან დიდია (მაქს 50MB)');
      return;
    }
    setSaving(brand);
    setUploadProgress(0);
    try {
      const fileName = `${brand}-catalog-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('catalogs').upload(fileName, file, {
        onUploadProgress: (p) => setUploadProgress((p.loaded / p.total) * 100),
      });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('catalogs').getPublicUrl(fileName);
      await handleUpdate(brand, { type: 'pdf', pdf_path: urlData.publicUrl });
    } catch (err: any) {
      toast.error(err.message || 'ატვირთვა ვერ მოხდა');
    } finally {
      setSaving(null);
      setUploadProgress(0);
    }
  };

  const handleFlipbookUpload = async (brand: string, files: FileList) => {
    if (!files.length) return;
    setUploadingPages(brand);
    try {
      await supabase.from('catalog_pages').delete().eq('brand', brand);
      const sorted = Array.from(files).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      let successCount = 0;
      for (let i = 0; i < sorted.length; i++) {
        const file = sorted[i];
        const fileName = `${brand}/page-${i + 1}-${Date.now()}.${file.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('catalogs').upload(fileName, file, { upsert: true });
        if (upErr) continue;
        const { data: urlData } = supabase.storage.from('catalogs').getPublicUrl(fileName);
        const { error: insErr } = await supabase.from('catalog_pages').insert({ brand, page_number: i + 1, image_url: urlData.publicUrl });
        if (!insErr) successCount++;
      }
      await handleUpdate(brand, { type: 'flipbook' });
      toast.success(`${successCount}/${sorted.length} გვერდი ატვირთულია`);
    } catch (err: any) {
      toast.error(`შეცდომა: ${err.message}`);
    } finally {
      setUploadingPages(null);
    }
  };

  const handleDelete = async (brand: string) => {
    if (!confirm(`წავშალოთ ${brand.toUpperCase()} კატალოგის მონაცემები?`)) return;
    setSaving(brand);
    try {
      await supabase.from('catalog_pages').delete().eq('brand', brand);
      await supabase.from('catalogs').update({ type: 'link', url: null, pdf_path: null } as any).eq('brand', brand);
      toast.success('კატალოგი წაიშალა');
      fetchCatalogs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-8 text-center font-display tracking-widest animate-pulse">LOADING...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {['avon', 'oriflame'].map((brand) => {
        const catalog = catalogs.find((c) => c.brand === brand);
        const isActive = catalog?.is_active ?? true;

        return (
          <div key={brand} className={`bg-card border rounded-sm p-6 space-y-5 relative group/card transition-opacity ${isActive ? 'border-border' : 'border-border opacity-60'}`}>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-xl uppercase tracking-wider">{brand} Catalog</h3>
                {/* Flipbook page count badge */}
                {catalog?.type === 'flipbook' && (catalog?.pageCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                    <Images size={9} />
                    {catalog.pageCount} გვ.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                {/* Preview */}
                <Button
                  variant="ghost"
                  size="icon"
                  title="კლიენტის view"
                  onClick={() => navigate('/catalog')}
                >
                  <ExternalLink size={15} />
                </Button>
                {/* Active toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  title={isActive ? 'კლიენტებს უჩვენებს — დასამალად დააჭირე' : 'დამალულია — გამოსაჩენად დააჭირე'}
                  onClick={() => handleUpdate(brand, { is_active: !isActive } as any)}
                  disabled={saving === brand}
                  className={isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-muted-foreground'}
                >
                  {isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                </Button>
                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-white hover:bg-destructive"
                  onClick={() => handleDelete(brand)}
                  disabled={saving === brand}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>

            {/* Active status label */}
            {!isActive && (
              <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                <EyeOff size={11} />
                კლიენტებს დამალულია — Eye ღილაკით გამოაჩინე
              </div>
            )}

            {/* Type selector */}
            <div>
              <Label>Catalog Type</Label>
              <div className="flex gap-2 mt-2">
                {(['link', 'pdf', 'flipbook'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={catalog?.type === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdate(brand, { type: t })}
                    className="flex-1 gap-1.5 text-xs"
                  >
                    {t === 'link' && <LinkIcon size={12} />}
                    {t === 'pdf' && <FileText size={12} />}
                    {t === 'flipbook' && <BookOpen size={12} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Link */}
            {catalog?.type === 'link' && (
              <div className="space-y-2">
                <Label>External URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={catalog.url || ''}
                    onChange={(e) => setCatalogs((prev) =>
                      prev.map((c) => c.brand === brand ? { ...c, url: e.target.value } : c)
                    )}
                    placeholder="https://..."
                    className="font-body text-sm"
                  />
                  <Button size="icon" onClick={() => handleUpdate(brand, { url: catalog.url })} disabled={saving === brand}>
                    {saving === brand ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                  </Button>
                </div>
              </div>
            )}

            {/* PDF */}
            {catalog?.type === 'pdf' && (
              <div className="space-y-3">
                <Label>PDF File</Label>
                {catalog.pdf_path && (
                  <a href={catalog.pdf_path} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground bg-muted p-2 rounded transition-colors">
                    <FileText size={11} /> მიმდინარე PDF (გახსნა)
                  </a>
                )}
                <input type="file" id={`${brand}-pdf`} className="hidden" accept="application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(brand, e.target.files[0])} />
                <Button variant="outline" className="w-full gap-2 border-dashed"
                  onClick={() => document.getElementById(`${brand}-pdf`)?.click()} disabled={saving === brand}>
                  {saving === brand ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
                  {catalog.pdf_path ? 'PDF-ის ჩანაცვლება' : 'PDF-ის ატვირთვა'}
                </Button>
                {saving === brand && uploadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>იტვირთება...</span><span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1" />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertCircle size={10} /> მაქს 50MB (Free Plan)
                </p>
              </div>
            )}

            {/* Flipbook */}
            {catalog?.type === 'flipbook' && (
              <div className="space-y-3">
                <Label>Flipbook გვერდები (სურათები)</Label>
                <p className="text-[11px] text-muted-foreground bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  ატვირთე რამდენიმე სურათი. დასალაგებლად სახელი მიეცი: page-01.jpg, page-02.jpg…
                  არსებული გვერდები ჩაინაცვლება.
                </p>
                <input type="file" id={`${brand}-flipbook`} className="hidden" accept="image/*" multiple
                  onChange={(e) => e.target.files && handleFlipbookUpload(brand, e.target.files)} />
                <Button variant="outline" className="w-full gap-2 border-dashed h-20 flex-col"
                  onClick={() => document.getElementById(`${brand}-flipbook`)?.click()} disabled={uploadingPages === brand}>
                  {uploadingPages === brand
                    ? <><Loader2 className="animate-spin" size={20} /><span>იტვირთება...</span></>
                    : <><Upload size={20} /><span>გვერდების ატვირთვა</span></>}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CatalogManagerProject;
