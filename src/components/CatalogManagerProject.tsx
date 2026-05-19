import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Link as LinkIcon, FileText, Save, Loader2, BookOpen, Trash2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

import { Database } from '@/types/supabase';

type CatalogRow = Database['public']['Tables']['catalogs']['Row'];

interface CatalogData extends Omit<CatalogRow, 'type' | 'updated_at'> {
    type: 'link' | 'pdf' | 'flipbook';
}

const CatalogManagerProject = () => {
    const [catalogs, setCatalogs] = useState<CatalogData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [uploadingPages, setUploadingPages] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const fetchCatalogs = async () => {
        try {
            const { data, error } = await supabase.from('catalogs').select('*');
            if (error) throw error;
            if (data) {
                // Ensure the type is correctly cast to our union
                const mappedData = data.map(item => ({
                    ...item,
                    type: (['link', 'pdf', 'flipbook'].includes(item.type) ? item.type : 'link') as 'link' | 'pdf' | 'flipbook'
                }));
                setCatalogs(mappedData);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (brand: string, updates: Partial<CatalogData>) => {
        setSaving(brand);
        try {
            const { error } = await supabase
                .from('catalogs')
                .update(updates as any)
                .eq('brand', brand);

            if (error) throw error;
            toast.success(`${brand.toUpperCase()} catalog updated`);
            fetchCatalogs();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(null);
        }
    };

    const handleFileUpload = async (brand: string, file: File) => {
        // Check file size limit (50MB = 52428800 bytes)
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File is too large (Maximum 50MB for Free Plan). Please compress it first.");
            return;
        }

        setSaving(brand);
        setUploadProgress(0);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${brand}-catalog-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('catalogs')
                .upload(fileName, file, {
                    onUploadProgress: (progress) => {
                        const percent = (progress.loaded / progress.total) * 100;
                        setUploadProgress(percent);
                    }
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('catalogs')
                .getPublicUrl(fileName);

            await handleUpdate(brand, {
                type: 'pdf',
                pdf_path: urlData.publicUrl
            });
        } catch (err: any) {
            console.error('Upload error:', err);
            toast.error(err.message || "Failed to upload file");
        } finally {
            setSaving(null);
            setUploadProgress(0);
        }
    };

    const handleFlipbookUpload = async (brand: string, files: FileList) => {
        if (!files.length) return;
        setUploadingPages(brand);

        try {
            // 1. Delete existing pages for this brand to avoid conflicts/duplicates
            // In a more advanced version, we could allow appending or reordering
            const { error: deleteError } = await supabase
                .from('catalog_pages')
                .delete()
                .eq('brand', brand);

            if (deleteError) throw deleteError;

            // 2. Upload new pages
            let successCount = 0;
            const totalFiles = files.length;

            // Sort files by name to ensure correct order if named sequentially
            const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

            for (let i = 0; i < sortedFiles.length; i++) {
                const file = sortedFiles[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${brand}/page-${i + 1}-${Date.now()}.${fileExt}`;

                // Upload to storage
                const { error: uploadError } = await supabase.storage
                    .from('catalogs')
                    .upload(fileName, file, { upsert: true });

                if (uploadError) {
                    console.error(`Failed to upload ${file.name}:`, uploadError);
                    continue;
                }

                const { data: urlData } = supabase.storage
                    .from('catalogs')
                    .getPublicUrl(fileName);

                // Insert into database
                const { error: insertError } = await supabase
                    .from('catalog_pages')
                    .insert({
                        brand,
                        page_number: i + 1,
                        image_url: urlData.publicUrl
                    });

                if (insertError) {
                    console.error(`Failed to record ${file.name}:`, insertError);
                } else {
                    successCount++;
                }
            }

            // 3. Update catalog type to flipbook
            await handleUpdate(brand, { type: 'flipbook' });

            toast.success(`Successfully uploaded ${successCount} of ${totalFiles} pages`);
        } catch (err: any) {
            console.error(err);
            toast.error(`Error uploading pages: ${err.message}`);
        } finally {
            setUploadingPages(null);
        }
    };

    const handleDelete = async (brand: string) => {
        if (!confirm(`Are you sure you want to delete the ${brand.toUpperCase()} catalog data and pages?`)) return;

        setSaving(brand);
        try {
            // 1. Delete catalog pages for this brand
            const { error: pagesError } = await supabase
                .from('catalog_pages')
                .delete()
                .eq('brand', brand);
            if (pagesError) throw pagesError;

            // 2. Reset catalog entry for this brand
            const { error: catalogError } = await supabase
                .from('catalogs')
                .update({
                    type: 'link',
                    url: null,
                    pdf_path: null
                } as any)
                .eq('brand', brand);
            if (catalogError) throw catalogError;

            toast.success(`${brand.toUpperCase()} catalog deleted successfully`);
            fetchCatalogs();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="p-8 text-center font-display tracking-widest animate-pulse">LOADING CATALOGS...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {['avon', 'oriflame'].map((brand) => {
                const catalog = catalogs.find(c => c.brand === brand);
                return (
                    <div key={brand} className="bg-card border border-border rounded-sm p-6 space-y-6 relative group/card">
                        <div className="flex justify-between items-center border-b border-border pb-4">
                            <h3 className="font-display text-xl uppercase tracking-wider">
                                {brand} Catalog
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-white hover:bg-destructive opacity-0 group-hover/card:opacity-100 transition-opacity"
                                onClick={() => handleDelete(brand)}
                                disabled={saving === brand}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>Catalog Type</Label>
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        variant={catalog?.type === 'link' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleUpdate(brand, { type: 'link' })}
                                        className="flex-1 gap-2 text-xs"
                                    >
                                        <LinkIcon size={14} /> Link
                                    </Button>
                                    <Button
                                        variant={catalog?.type === 'pdf' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleUpdate(brand, { type: 'pdf' })}
                                        className="flex-1 gap-2 text-xs"
                                    >
                                        <FileText size={14} /> PDF
                                    </Button>
                                    <Button
                                        variant={catalog?.type === 'flipbook' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleUpdate(brand, { type: 'flipbook' })}
                                        className="flex-1 gap-2 text-xs"
                                    >
                                        <BookOpen size={14} /> Flipbook
                                    </Button>
                                </div>
                            </div>

                            {catalog?.type === 'link' && (
                                <div className="space-y-2">
                                    <Label>External URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={catalog.url || ''}
                                            onChange={(e) => {
                                                const newCatalogs = [...catalogs];
                                                const idx = newCatalogs.findIndex(c => c.brand === brand);
                                                if (idx !== -1) {
                                                    newCatalogs[idx].url = e.target.value;
                                                    setCatalogs(newCatalogs);
                                                }
                                            }}
                                            placeholder="https://..."
                                            className="font-body text-sm"
                                        />
                                        <Button
                                            size="icon"
                                            onClick={() => handleUpdate(brand, { url: catalog.url })}
                                            disabled={saving === brand}
                                        >
                                            {saving === brand ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {catalog?.type === 'pdf' && (
                                <div className="space-y-4">
                                    <Label>PDF File</Label>
                                    {catalog?.pdf_path && (
                                        <div className="text-xs text-muted-foreground truncate bg-muted p-2 rounded flex items-center gap-2">
                                            <FileText size={12} />
                                            <a href={catalog.pdf_path} target="_blank" rel="noreferrer" className="hover:underline">Current PDF</a>
                                        </div>
                                    )}
                                    <div className="relative space-y-2">
                                        <input
                                            type="file"
                                            id={`${brand}-pdf-file`}
                                            className="hidden"
                                            accept="application/pdf"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(brand, e.target.files[0])}
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2 border-dashed"
                                            onClick={() => document.getElementById(`${brand}-pdf-file`)?.click()}
                                            disabled={saving === brand}
                                        >
                                            {saving === brand ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                            {catalog?.pdf_path ? 'Replace PDF' : 'Upload PDF'}
                                        </Button>

                                        {saving === brand && uploadProgress > 0 && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                                                    <span>Uploading...</span>
                                                    <span>{Math.round(uploadProgress)}%</span>
                                                </div>
                                                <Progress value={uploadProgress} className="h-1" />
                                            </div>
                                        )}

                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                            <AlertCircle size={10} /> Max size: 50MB (Free Plan limit)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {catalog?.type === 'flipbook' && (
                                <div className="space-y-4">
                                    <Label>Flipbook Pages (Images)</Label>
                                    <div className="text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-2 rounded">
                                        <p>Upload multiple images. They will be sorted alphabetically (e.g., page-01.jpg, page-02.jpg). Existing pages for this brand will be replaced.</p>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id={`${brand}-flipbook-files`}
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => e.target.files && handleFlipbookUpload(brand, e.target.files)}
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2 border-dashed h-24 flex-col"
                                            onClick={() => document.getElementById(`${brand}-flipbook-files`)?.click()}
                                            disabled={uploadingPages === brand}
                                        >
                                            {uploadingPages === brand ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={24} />
                                                    <span>Uploading pages...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={24} />
                                                    <span>Select Page Images</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CatalogManagerProject;
