import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Tag, Image, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CategoryProductsModal } from '../../components/admin/CategoryProductsModal';

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
  product_count?: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  image_url: string;
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image_url: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories with product count
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include product count
      const categoriesWithCount = data?.map(category => ({
        ...category,
        product_count: category.products?.[0]?.count || 0
      })) || [];

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    console.log('Category clicked:', category.name); // Debug log
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchCategories();
      resetForm();
    } catch (error: any) {
      if (error.code === '23505') {
        setFormError('A category with this name already exists.');
      } else {
        setFormError(error.message || 'Failed to save category');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent category click
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      image_url: category.image_url
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent category click
    if (!confirm('Are you sure you want to delete this category? This will remove the category from all associated products.')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (error: any) {
      alert('Failed to delete category: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', image_url: '' });
    setEditingCategory(null);
    setShowForm(false);
    setFormError('');
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Organize your products into categories. Click on a category to view its products.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          icon={Plus}
        >
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          className="max-w-md"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              hover 
              className="p-6 h-full cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="aspect-w-16 aspect-h-9 mb-4">
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {category.name}
                  </h3>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(category, e)}
                      icon={Edit}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    >
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(category.id, e)}
                      icon={Trash2}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700"
                    >
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {category.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                    <Package className="h-3 w-3 mr-1" />
                    {category.product_count} products
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(category.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No categories found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first category'}
          </p>
          <Button onClick={() => setShowForm(true)} icon={Plus}>
            Add Category
          </Button>
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={resetForm}></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleFormSubmit} className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                
                <div className="space-y-4">
                  <Input
                    label="Category Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter category name"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Describe this category..."
                      required
                    />
                  </div>
                  
                  <Input
                    label="Image URL"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {formError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={formLoading}
                  >
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Products Modal */}
      <CategoryProductsModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />
    </div>
  );
};