"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PartType } from "../../type";

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (part: Omit<PartType, "id">) => void;
  machineTypes: string[];
  categories: string[];
}

export default function AddPartModal({
  isOpen,
  onClose,
  onSubmit,
  machineTypes,
  categories,
}: AddPartModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    machineType: "",
    category: "",
    quantity: 0,
    minThreshold: 0,
    description: "",
    image: "",
    importedDate: new Date().toISOString().split("T")[0],
    unit: "pcs",
    location: "",
  });

  const [newMachineType, setNewMachineType] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [addingMachineType, setAddingMachineType] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        machineType: machineTypes[0] || "",
        category: categories[0] || "",
        quantity: 0,
        minThreshold: 0,
        description: "",
        image: "",
        importedDate: new Date().toISOString().split("T")[0],
        unit: "pcs",
        location: "",
      });
      setNewMachineType("");
      setNewCategory("");
      setAddingMachineType(false);
      setAddingCategory(false);
    }
  }, [isOpen, machineTypes, categories]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "minThreshold" ? Number(value) : value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
          <h2 className="text-lg font-bold">Add New Spare Part</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Part Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                  required
                />
              </div>

              {/* Machine Type with "Add New" option */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Machine Type*
                </label>
                {!addingMachineType ? (
                  <div className="flex items-center gap-2">
                    <select
                      name="machineType"
                      value={formData.machineType}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                      required
                    >
                      {machineTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value="">-- Add New --</option>
                    </select>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded"
                      onClick={() => {
                        setAddingMachineType(true);
                        setFormData((prev) => ({ ...prev, machineType: "" }));
                      }}
                    >
                      +New
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMachineType}
                      onChange={(e) => setNewMachineType(e.target.value)}
                      placeholder="New machine type"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                    />
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-primary text-white rounded"
                      onClick={() => {
                        if (newMachineType.trim()) {
                          setFormData((prev) => ({
                            ...prev,
                            machineType: newMachineType.trim(),
                          }));
                          setAddingMachineType(false);
                        }
                      }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded"
                      onClick={() => {
                        setAddingMachineType(false);
                        setFormData((prev) => ({
                          ...prev,
                          machineType: machineTypes[0] || "",
                        }));
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Category with "Add New" option */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category*
                </label>
                {!addingCategory ? (
                  <div className="flex items-center gap-2">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="">-- Add New --</option>
                    </select>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded"
                      onClick={() => {
                        setAddingCategory(true);
                        setFormData((prev) => ({ ...prev, category: "" }));
                      }}
                    >
                      +New
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                    />
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-primary text-white rounded"
                      onClick={() => {
                        if (newCategory.trim()) {
                          setFormData((prev) => ({
                            ...prev,
                            category: newCategory.trim(),
                          }));
                          setAddingCategory(false);
                        }
                      }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded"
                      onClick={() => {
                        setAddingCategory(false);
                        setFormData((prev) => ({
                          ...prev,
                          category: categories[0] || "",
                        }));
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity*
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min={0}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Min Threshold*
                  </label>
                  <input
                    type="number"
                    name="minThreshold"
                    value={formData.minThreshold}
                    onChange={handleChange}
                    min={0}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    The minimum number of units to keep in stock before
                    triggering a low stock alert.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit*</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                  required
                >
                  <option value="pcs">pcs</option>
                  <option value="box">box</option>
                  <option value="roll">roll</option>
                  <option value="meter">meter</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                  <option value="set">set</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Import Date*
                </label>
                <input
                  type="date"
                  name="importedDate"
                  value={formData.importedDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Storage Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Shelf A3"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
                />
              </div>

              {/* Preview of Image */}
              {formData.image && (
                <div className="mt-4 p-2 border dark:border-gray-700 rounded-md">
                  <p className="text-xs font-medium mb-1">Image Preview:</p>
                  <div className="h-32 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded">
                    <img
                      src={formData.image}
                      alt="Part preview"
                      className="max-h-28 max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/parts/placeholder.jpg";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm"
            >
              Add Part
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
