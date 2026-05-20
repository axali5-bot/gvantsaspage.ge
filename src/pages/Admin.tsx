import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Plus, Upload, X, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download, FileText, FileSpreadsheet, FileUp, Package, Clock, CheckCircle, Ban, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import CategoryManager from '@/components/CategoryManager';
import CatalogManagerProject from '@/components/CatalogManagerProject';
import QuickAddCategory from '@/components/QuickAddCategory';
import { ImageOptimizer } from '@/components/ImageOptimizer';
import { Image as ImageIcon } from 'lucide-react';


const OrderRow = ({ order, updateOrderStatus }: { order: any, updateOrderStatus: any }) => {
  const [rowStatus, setRowStatus] = useState(order.status || 'pending');
  const [saving, setSaving] = useState(false);

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      const result = await updateOrderStatus(order.id, rowStatus);
      if (result.success) {
        toast.success("Order status updated");
      } else {
        toast.error("Failed to update status");
        setRowStatus(order.status); // reset on error
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      setRowStatus(order.status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow key={order.id} className="border-border hover:bg-muted/50 transition-colors">
      <TableCell className="font-body text-sm">
        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell className="font-body">
        <div className="flex flex-col">
          <span className="font-medium">{order.customer_name || 'Anonymous'}</span>
          <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
        </div>
      </TableCell>
      <TableCell className="font-body font-semibold">
        {order.total_price || 0} ₾
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <select
            value={rowStatus}
            onChange={(e) => setRowStatus(e.target.value as any)}
            className={`text-xs font-body rounded-sm border bg-background px-2 py-1 focus:ring-1 focus:ring-primary outline-none transition-colors ${rowStatus === 'completed' ? 'border-green-500/50 text-green-600' :
              rowStatus === 'processing' ? 'border-blue-500/50 text-blue-600' :
                rowStatus === 'cancelled' ? 'border-red-500/50 text-red-600' :
                  'border-yellow-500/50 text-yellow-700'
              }`}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {rowStatus !== order.status && (
            <Button
              size="sm"
              className="h-7 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-none"
              onClick={handleSaveStatus}
              disabled={saving}
            >
              {saving ? "..." : "Save"}
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-background overflow-hidden">
            <DialogHeader>
              <DialogTitle className="font-display">Order Details - #{order?.id?.slice(0, 8) || 'N/A'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mb-1">Customer Info</p>
                  <p className="font-semibold">{order.customer_name || 'N/A'}</p>
                  <p className="text-sm">{order.customer_phone}</p>
                  <p className="text-sm mt-1">{order.customer_address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mb-1">Order Summary</p>
                  <p>Total: <span className="font-bold">{order.total_price || 0} ₾</span></p>
                  <p>Date: {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</p>
                  <div className="mt-4">
                    <Badge variant={
                      order.status === 'completed' ? 'default' :
                        order.status === 'processing' ? 'secondary' :
                          order.status === 'cancelled' ? 'destructive' :
                            'outline'
                    } className={`capitalize ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                      }`}>
                      {order.status || 'pending'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mb-4">Order Items</p>
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-6 bg-muted/30 p-4 rounded-xl border border-border/30">
                      <div className="h-28 w-28 flex-shrink-0 bg-secondary rounded-lg overflow-hidden border border-border/50 shadow-sm">
                        {item.products?.image_url ? (
                          <img
                            src={item.products.image_url}
                            alt={item.products.name || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
                            <Package size={32} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-lg font-medium truncate mb-1">
                          {item.products?.name || item.products?.name_ka || item.products?.name_en || 'Standard Fragrance'}
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          {item.quantity} x {item.price_at_time || 0} ₾
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl font-semibold">
                          {(item.quantity * (item.price_at_time || 0)).toFixed(2)} ₾
                        </p>
                      </div>
                    </div>
                  ))}
                  {!order.order_items?.length && (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No specific items found for this order.</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
};

const Admin = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const { products, loading, error } = useProducts();
  const { categories, refetch: refetchCategories } = useCategories();
  const { orders, loading: ordersLoading, error: ordersError, updateOrderStatus } = useOrders();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    parent_category_id: '',
    description: '',
    description_ka: '',
    description_en: '',
    description_ru: '',
    stock_quantity: '0',
    gender: 'Unisex',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<'name' | 'price' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    return searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'price':
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Handle sort column click
  const handleSort = (field: 'name' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Get sort icon for column
  const getSortIcon = (field: 'name' | 'price') => {
    if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />;
    return sortDirection === 'asc'
      ? <ArrowUp size={14} className="ml-1" />
      : <ArrowDown size={14} className="ml-1" />;
  };

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Description', 'Price', 'Category ID', 'Stock Quantity', 'Image URL', 'Gender'];
    const csvContent = [
      headers.join(','),
      ...sortedProducts.map(product => [
        product.id,
        `"${(product.name || '').replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        product.price,
        product.category_id,
        product.stock_quantity,
        `"${(product.image_url || '').replace(/"/g, '""')}"`,
        `"${(product.gender || 'Unisex').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Products exported to CSV');
  };

  // Export to Excel (XLSX format using XML)
  const exportToExcel = () => {
    const headers = ['ID', 'Name', 'Description', 'Price', 'Category ID', 'Stock Quantity', 'Image URL', 'Gender'];

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '<Worksheet ss:Name="Products">\n<Table>\n';

    // Header row
    xmlContent += '<Row>\n';
    headers.forEach(header => {
      xmlContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
    });
    xmlContent += '</Row>\n';

    // Data rows
    sortedProducts.forEach(product => {
      xmlContent += '<Row>\n';
      xmlContent += `<Cell><Data ss:Type="String">${product.id}</Data></Cell>\n`;
      xmlContent += `<Cell><Data ss:Type="String">${escapeXml(product.name || '')}</Data></Cell>\n`;
      xmlContent += `<Cell><Data ss:Type="String">${escapeXml(product.description || '')}</Data></Cell>\n`;
      xmlContent += `<Cell><Data ss:Type="Number">${product.price}</Data></Cell>\n`;
      xmlContent += `<Cell><Data ss:Type="String">${product.category_id}</Data></Cell>\n`;
      xmlContent += `<Cell><Data ss:Type="Number">${product.stock_quantity}</Data></Cell>\n`;
      xmlContent += `<Cell><Data ss:Type="String">${escapeXml(product.image_url || '')}</Data></Cell>\n`;
      xmlContent += `<Cell><Data ss:Type="String">${escapeXml(product.gender || 'Unisex')}</Data></Cell>\n`;
      xmlContent += '</Row>\n';
    });

    xmlContent += '</Table>\n</Worksheet>\n</Workbook>';

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Products exported to Excel');
  };

  // Helper function to escape XML special characters
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Parse CSV content
  const parseCSV = (content: string): Record<string, string>[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  // Handle CSV import
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      return;
    }

    setImporting(true);

    try {
      const content = await file.text();
      const rows = parseCSV(content);

      if (rows.length === 0) {
        toast.error('No valid data found in CSV file');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        try {
          const productData: Record<string, string | number> = {
            name_ka: row.name || '',
            name_en: row.name || '',
            name_ru: row.name || '',
            description_ka: row.description || '',
            description_en: row.description || '',
            description_ru: row.description || '',
            price: parseFloat(row.price) || 0,
            category_id: row.category_id || '',
            stock_quantity: parseInt(row.stock_quantity) || 0,
            image_url: row.image_url || '',
            gender: row.gender || 'Unisex',
          };

          const { error: insertError } = await supabase.from('products').insert([productData as any]);

          if (insertError) {
            errorCount++;
            console.error('Failed to import row:', insertError);
          } else {
            successCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} product(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} product(s)`);
      }

      if (successCount > 0) {
        window.location.reload();
      }
    } catch (err) {
      toast.error('Failed to parse CSV file');
      console.error(err);
    } finally {
      setImporting(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
      setImportDialogOpen(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category_id: '',
      parent_category_id: '',
      description: '',
      description_ka: '',
      description_en: '',
      description_ru: '',
      stock_quantity: '0',
      gender: 'Unisex',
    });
    clearImage();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    if (!imageFile) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadImage(imageFile);

      // Ensure name field is not empty
      const productName = formData.name?.trim() || 'Unnamed Product';

      const { error: insertError } = await supabase.from('products').insert([{
        name: productName, // Add name field for NOT NULL constraint
        name_ka: productName, // Map name to name_ka as default
        name_en: productName, // Also fill others for now
        name_ru: productName,
        price: parseFloat(formData.price) || 0,
        image_url: imageUrl,
        category_id: formData.category_id || formData.parent_category_id,
        description: formData.description_ka || formData.description || '',
        description_ka: formData.description_ka || '', // Fill description fields
        description_en: formData.description_en || '',
        description_ru: formData.description_ru || '',
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        gender: formData.gender || 'Unisex',
      } as any]);

      if (insertError) {
        throw new Error(`Failed to add product: ${insertError.message}`);
      }

      toast.success('Product added successfully!');
      setOpen(false);
      resetForm();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    const currentCategory = categories.find(c => c.id === product.category_id);
    const parentId = currentCategory?.parent_id || (currentCategory && !currentCategory.parent_id ? currentCategory.id : '');
    const category_id = currentCategory?.parent_id ? currentCategory.id : '';

    setFormData({
      name: product.name || '',
      price: product.price?.toString() || '',
      category_id: category_id,
      parent_category_id: parentId,
      description: product.description || '',
      description_ka: product.description_ka || product.description || '',
      description_en: product.description_en || '',
      description_ru: product.description_ru || '',
      stock_quantity: product.stock_quantity?.toString() || '0',
      gender: product.gender || 'Unisex',
    });
    setImagePreview(product.image_url);
    setImageFile(null);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    if (!formData.name?.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editingProduct.image_url;

      // If new image selected, upload it
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productName = formData.name.trim();

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: productName,
          name_ka: productName,
          name_en: productName,
          name_ru: productName,
          price: parseFloat(formData.price) || 0,
          image_url: imageUrl,
          category_id: formData.category_id || formData.parent_category_id,
          description: formData.description_ka || formData.description || '',
          description_ka: formData.description_ka || '',
          description_en: formData.description_en || '',
          description_ru: formData.description_ru || '',
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          gender: formData.gender || 'Unisex',
        } as any)
        .eq('id', editingProduct.id);

      if (updateError) {
        throw new Error(`Failed to update product: ${updateError.message}`);
      }

      toast.success('Product updated successfully!');
      setEditOpen(false);
      setEditingProduct(null);
      resetForm();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    setDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (deleteError) {
        throw new Error(`Failed to delete product: ${deleteError.message}`);
      }

      toast.success('Product deleted successfully!');
      setDeleteOpen(false);
      setDeletingProduct(null);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    setBulkDeleting(true);

    try {
      const idsToDelete = Array.from(selectedProducts);
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete products: ${deleteError.message}`);
      }

      toast.success(`Successfully deleted ${idsToDelete.length} product(s)`);
      setBulkDeleteOpen(false);
      setSelectedProducts(new Set());
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const renderImageUpload = (isEdit: boolean = false) => (
    <div>
      <Label>Product Image</Label>
      <div className="mt-2">
        {imagePreview ? (
          <div className="relative w-full h-40 rounded border border-border overflow-hidden">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => (isEdit ? editFileInputRef : fileInputRef).current?.click()}
            className="w-full h-40 border-2 border-dashed border-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload size={24} className="text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload image</span>
          </div>
        )}
        <input
          ref={isEdit ? editFileInputRef : fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderFormFields = () => (
    <>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="price">Price (₾)</Label>
        <Input
          id="price"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="stock_quantity">Stock Quantity</Label>
        <Input
          id="stock_quantity"
          type="number"
          value={formData.stock_quantity}
          onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center mb-1">
            <Label htmlFor="parent_category_id" className="mb-0">Category</Label>
            <QuickAddCategory
              onSuccess={(cat) => {
                refetchCategories();
                setFormData(prev => ({ ...prev, parent_category_id: cat.id, category_id: '' }));
              }}
              label="Add New Category"
            />
          </div>
          <select
            id="parent_category_id"
            value={formData.parent_category_id}
            onChange={(e) => setFormData({ ...formData, parent_category_id: e.target.value, category_id: '' })}
            className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground"
            required
          >
            <option value="">Select a category</option>
            {categories
              ?.filter(cat => !cat.parent_id)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name_ka}
                </option>
              ))
            }
          </select>
        </div>
        <div>
          <div className="flex items-center mb-1">
            <Label htmlFor="category_id" className="mb-0">Subcategory</Label>
            {formData.parent_category_id && (
              <QuickAddCategory
                parentId={formData.parent_category_id}
                onSuccess={(cat) => {
                  refetchCategories();
                  setFormData(prev => ({ ...prev, category_id: cat.id }));
                }}
                label="Add New Subcategory"
              />
            )}
          </div>
          <select
            id="category_id"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground"
            disabled={!formData.parent_category_id}
          >
            <option value="">Select a subcategory</option>
            {categories
              ?.filter(sub => sub.parent_id === formData.parent_category_id)
              .map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name_ka}
                </option>
              ))
            }
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="description_ka">Description (KA)</Label>
        <Input
          id="description_ka"
          value={formData.description_ka}
          onChange={(e) => setFormData({ ...formData, description_ka: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description_en">Description (EN)</Label>
        <Input
          id="description_en"
          value={formData.description_en}
          onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description_ru">Description (RU)</Label>
        <Input
          id="description_ru"
          value={formData.description_ru}
          onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground"
        >
          <option value="Unisex">Unisex</option>
          <option value="Man">Man</option>
          <option value="Woman">Woman</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="font-display text-2xl font-semibold tracking-wider">
              {t('admin.title')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-xs text-muted-foreground hover:text-destructive">
              Logout
            </Button>
            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="font-body text-sm tracking-wide gap-2">
                  <Plus size={18} />
                  {t('admin.addNew')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {renderFormFields()}
                  {renderImageUpload(false)}
                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Add Product'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Import CSV Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-body text-sm tracking-wide gap-2">
                  <FileUp size={18} />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle className="font-display">Import Products from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with the following columns: name, description, price, category_id, stock_quantity, image_url
                  </p>
                  <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                    name,description,price,category_id,stock_quantity,image_url<br />
                    "Fragrance Name","Description",99.99,"category-uuid",10,"https://..."
                  </div>
                  <div
                    onClick={() => csvInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <FileUp size={24} className="text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {importing ? 'Importing...' : 'Click to select CSV file'}
                    </span>
                  </div>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                    disabled={importing}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => {
        setEditOpen(isOpen);
        if (!isOpen) {
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {renderFormFields()}
            {renderImageUpload(true)}
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedProducts.size} Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProducts.size} selected product(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? 'Deleting...' : `Delete ${selectedProducts.size} Products`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package size={16} />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Clock size={16} />
              Orders
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Search size={16} />
              Categories
            </TabsTrigger>
            <TabsTrigger value="catalogs" className="flex items-center gap-2">
              <FileText size={16} />
              Catalogs
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="flex items-center gap-2">
              <ImageIcon size={16} />
              Optimizer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="bg-card border border-border rounded-sm">
              <div className="p-4 border-b border-border space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      placeholder={t('admin.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 font-body text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCSV}
                      className="font-body text-xs tracking-wide gap-2"
                    >
                      <Download size={14} />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToExcel}
                      className="font-body text-xs tracking-wide gap-2"
                    >
                      <FileSpreadsheet size={14} />
                      Excel
                    </Button>
                    {selectedProducts.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkDeleteOpen(true)}
                        className="font-body text-xs tracking-wide gap-2"
                      >
                        <Trash2 size={14} />
                        Delete ({selectedProducts.size})
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelected = new Set(selectedProducts);
                              paginatedProducts.forEach(p => newSelected.add(p.id));
                              setSelectedProducts(newSelected);
                            } else {
                              const newSelected = new Set(selectedProducts);
                              paginatedProducts.forEach(p => newSelected.delete(p.id));
                              setSelectedProducts(newSelected);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground transition-colors text-right"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Price
                          {getSortIcon('price')}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right border-none">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-body">
                          Loading products...
                        </TableCell>
                      </TableRow>
                    ) : paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-body">
                          No products found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProducts.map((product) => (
                        <TableRow key={product.id} className="border-border hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                              checked={selectedProducts.has(product.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedProducts);
                                if (e.target.checked) {
                                  newSelected.add(product.id);
                                } else {
                                  newSelected.delete(product.id);
                                }
                                setSelectedProducts(newSelected);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-sm border border-border"
                            />
                          </TableCell>
                          <TableCell className="font-medium font-body">{product.name}</TableCell>
                          <TableCell className="text-right font-body font-semibold">
                            {product.price} ₾
                          </TableCell>
                          <TableCell className="text-right font-body">
                            {product.stock_quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(product)}
                                className="h-8 w-8 hover:text-accent"
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(product)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-muted-foreground font-body">
                    Showing {startIndex + 1} to {Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="min-w-[36px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="bg-card border border-border rounded-sm">
              <div className="p-4 border-b border-border">
                <h2 className="font-body text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                  Order Management
                </h2>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-body">
                          Loading orders...
                        </TableCell>
                      </TableRow>
                    ) : ordersError ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-red-500 font-body">
                          Error: {ordersError}
                        </TableCell>
                      </TableRow>
                    ) : orders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-body">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders?.map((order) => (
                        <OrderRow
                          key={order.id}
                          order={order}
                          updateOrderStatus={updateOrderStatus}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="catalogs">
            <CatalogManagerProject />
          </TabsContent>

          <TabsContent value="optimizer">
            <ImageOptimizer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
