import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/hooks/useProducts';

interface Props {
  products: Product[];
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function csvCell(val: string | number | null | undefined) {
  const s = String(val ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

export const ProductExportButtons = ({ products }: Props) => {
  const headers = [
    'ID', 'name_ka', 'name_en', 'name_ru',
    'description_ka', 'description_en', 'description_ru',
    'price', 'category_id', 'stock_quantity', 'image_url', 'gender',
  ];

  const exportCSV = () => {
    const rows = products.map((p) => [
      p.id, p.name_ka, p.name_en, p.name_ru,
      p.description_ka, p.description_en, p.description_ru,
      p.price, p.category_id, p.stock_quantity, p.image_url, p.gender,
    ].map(csvCell).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Exported to CSV');
  };

  const exportExcel = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Worksheet ss:Name="Products">\n<Table>\n';
    xml += '<Row>\n' + headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('\n') + '\n</Row>\n';
    for (const p of products) {
      xml += '<Row>\n';
      const cells = [
        { v: p.id, t: 'String' }, { v: p.name_ka, t: 'String' }, { v: p.name_en ?? '', t: 'String' }, { v: p.name_ru ?? '', t: 'String' },
        { v: p.description_ka ?? '', t: 'String' }, { v: p.description_en ?? '', t: 'String' }, { v: p.description_ru ?? '', t: 'String' },
        { v: p.price, t: 'Number' }, { v: p.category_id ?? '', t: 'String' }, { v: p.stock_quantity ?? 0, t: 'Number' },
        { v: p.image_url ?? '', t: 'String' }, { v: p.gender ?? '', t: 'String' },
      ];
      cells.forEach(({ v, t }) => { xml += `<Cell><Data ss:Type="${t}">${t === 'String' ? escapeXml(String(v)) : v}</Data></Cell>\n`; });
      xml += '</Row>\n';
    }
    xml += '</Table>\n</Worksheet>\n</Workbook>';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel' }));
    link.download = `products_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Exported to Excel');
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={exportCSV}>
        <FileDown size={14} className="mr-1" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel}>
        <FileDown size={14} className="mr-1" /> Excel
      </Button>
    </>
  );
};

export default ProductExportButtons;
