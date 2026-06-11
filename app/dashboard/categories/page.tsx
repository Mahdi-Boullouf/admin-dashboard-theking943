"use client";

import React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { categoriesAPI } from "@/lib/api-client";
import { TableSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, ToggleLeft as Toggle2Off, ToggleLeft as Toggle2On } from "lucide-react";
import Loading from "../appointments/loading";

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState({ speciality_name: "" });
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const queryClient = useQueryClient();
  const ITEMS_PER_PAGE = 10;

  const { data: response, isLoading } = useQuery({
    queryKey: ["categories", page, search],
    queryFn: () => categoriesAPI.getCategories(page, ITEMS_PER_PAGE, search),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => categoriesAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      setIsAddingCategory(false);
      setNewCategory({ speciality_name: "" });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      categoriesAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
      setIsEditingCategory(false);
      setEditingCategory(null);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete category");
    },
  });

  const categories = response?.data?.data || [];
  // Backend returns pagination meta under `pagination` (total, totalPages)
  const pagination = response?.data?.pagination;
  const totalResults = pagination?.total ?? categories.length;
  const totalPages = pagination?.totalPages ?? Math.ceil(totalResults / ITEMS_PER_PAGE);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.speciality_name) {
      toast.error("Please enter category name");
      return;
    }
    
    const formData = new FormData();
    formData.append("speciality_name", newCategory.speciality_name);
    if (selectedFile) {
      formData.append("category_image", selectedFile);
    }
    
    createMutation.mutate(formData);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.speciality_name) {
      toast.error("Please enter category name");
      return;
    }

    const formData = new FormData();
    formData.append("speciality_name", editingCategory.speciality_name);
    formData.append("status", editingCategory.status);
    if (selectedFile) {
      formData.append("category_image", selectedFile);
    }

    updateMutation.mutate({
      id: editingCategory._id,
      data: formData,
    });
  };

  const handleEditClick = (category: any) => {
    setEditingCategory({ ...category });
    setIsEditingCategory(true);
    setSelectedFile(null);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600 mt-2">Add, edit, or remove categories</p>
          </div>
          <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Create a new category for medical specialties</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Cardiology"
                    value={newCategory.speciality_name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, speciality_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Category Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by name"
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Categories List</CardTitle>
            <CardDescription>Showing {categories.length} of {totalResults} results</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={ITEMS_PER_PAGE} />
            ) : categories.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sl No</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category: any, index: number) => (
                      <TableRow key={category._id}>
                        <TableCell>{(page - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>
                          {category.category_image_url ? (
                            <img
                              src={category.category_image_url || "/placeholder.svg"}
                              alt={category.speciality_name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gray-200 rounded" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{category.speciality_name}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              category.status
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {category.status ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateMutation.mutate({
                                  id: category._id,
                                  data: { status: !category.status },
                                })
                              }
                              disabled={updateMutation.isPending}
                            >
                              {category.status ? (
                                <Toggle2On className="h-4 w-4 text-purple-600" />
                              ) : (
                                <Toggle2Off className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditClick(category)}
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(category._id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No categories found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Category Dialog */}
        <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update the category details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Cardiology"
                  value={editingCategory?.speciality_name || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, speciality_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Category Image</Label>
                <div className="flex items-center gap-4">
                  {editingCategory?.category_image_url && !selectedFile && (
                    <img 
                      src={editingCategory.category_image_url} 
                      alt="Current" 
                      className="h-10 w-10 rounded object-cover" 
                    />
                  )}
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
