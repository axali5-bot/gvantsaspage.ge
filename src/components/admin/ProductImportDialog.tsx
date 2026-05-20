import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
      else { current += char; }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

export const ProductImportDialog = ({ open, onOpenChange }: Props) => {
  const qc = useQueryClient();
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please select a .csv file'); return; }

    setImporting(true);
    try {
      const content = await file.text();
      const rows = parseCSV(content);
      if (rows.length === 0) { toast.error('No valid data found in CSV'); return; }

      let ok = 0, fail = 0;
      for (const row of rows) {
        const { error } = await supabase.from('products').insert([{
          name_ka: row.name_ka || row.name || 'Unnamed',
          name_en: row.name_en || row.name || null,
          name_ru: row.name_ru || row.name || null,
          description_ka: row.description_ka || row.description || null,
          description_en: row.description_en || null,
          description_ru: row.description_ru || null,
          price: parseFloat(row.price) || 0,
          category_id: row.category_id || null,
          stock_quantity: parseInt(row.stock_quantity) || 0,
          image_url: row.image_url || null,
          gender: row.gender || 'Unisex',
        }] as any);
        if (error) { fail++; } else { ok++; }
      }

      if (ok > 0) { toast.success(`Imported ${ok} product(s)`); qc.invalidateQueries({ queryKey: ['products'] }); }
      if (fail > 0) { toast.error(`Failed to import ${fail} row(s)`); }
      if (ok > 0) onOpenChange(false);
    } catch {
      toast.error('Failed to parse CSV file');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle className="font-display">Import Products from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CSV columns: <code>name_ka, name_en, name_ru, description_ka, description_en, description_ru, price, category_id, stock_quantity, image_url, gender</code>
          </p>
          <p className="text-xs text-muted-foreground">
            Legacy <code>name</code> / <code>description</code> columns also accepted as fallback to <code>name_ka</code>.
          </p>
          <div
            onClick={() => !importing && fileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload size={24} className="text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {importing ? 'Importing...' : 'Click to select CSV file'}
            </span>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportDialog;
