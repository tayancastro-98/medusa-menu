import { supabase } from './supabaseClient.js';

export const MenuStore = {
    // PRODUCTS
    async getProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error("Error fetching products:", error);
            return [];
        }
        return data;
    },

    async toggleProduct(id, currentStatus) {
        const { error } = await supabase
            .from('products')
            .update({ active: !currentStatus })
            .eq('id', id);
        
        if (!error) {
            window.dispatchEvent(new Event('menuUpdate'));
        }
    },

    async deleteProduct(id) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
            
        if (!error) {
            window.dispatchEvent(new Event('menuUpdate'));
        }
    },

    async updateProduct(id, newData) {
        const { error } = await supabase
            .from('products')
            .update(newData)
            .eq('id', id);

        if (!error) {
            window.dispatchEvent(new Event('menuUpdate'));
        }
    },

    async addProduct(product) {
        const newProduct = { ...product, active: true, promo: product.promo || false };
        const { error } = await supabase
            .from('products')
            .insert([newProduct]);

        if (!error) {
            window.dispatchEvent(new Event('menuUpdate'));
        }
    },

    // IMAGE UPLOAD (New)
    async uploadImage(file) {
        if (!file) return "logo-medusa.png";
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('menu_images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image', uploadError);
            return "logo-medusa.png";
        }

        const { data } = supabase.storage
            .from('menu_images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // CATEGORIES
    async getCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('order', { ascending: true });

        if (error) {
            console.error("Error fetching categories:", error);
            return [];
        }
        return data;
    },

    async addCategory(name, currentCount) {
        const { error } = await supabase
            .from('categories')
            .insert([{ name: name.toUpperCase(), order: currentCount + 1 }]);
            
        if (!error) {
            window.dispatchEvent(new Event('categoriesUpdate'));
        }
    },

    async deleteCategory(id) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
            
        if (!error) {
            window.dispatchEvent(new Event('categoriesUpdate'));
        }
    },

    async updateCategory(id, name) {
        const { error } = await supabase
            .from('categories')
            .update({ name: name.toUpperCase() })
            .eq('id', id);
            
        if (!error) {
            window.dispatchEvent(new Event('categoriesUpdate'));
        }
    }
};
