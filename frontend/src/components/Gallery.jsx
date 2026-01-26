import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Move, Trash2, ZoomIn, Loader2 } from 'lucide-react';
import axios from '../services/api'; // Use our api instance
import { clsx } from 'clsx';

export default function Gallery({ endpoint = '/users/me/images/' }) {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Fetch Images
    const fetchImages = useCallback(async () => {
        try {
            const res = await axios.get(endpoint);
            const data = res.data.results ? res.data.results : res.data;
            setImages(data.sort((a, b) => a.order - b.order));
        } catch (error) {
            console.error("Failed to load images", error);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    // Handle Upload
    const onDrop = useCallback(async (acceptedFiles) => {
        setUploading(true);
        const formData = new FormData();
        for (const file of acceptedFiles) {
            formData.append('image', file);
            try {
                await axios.post(`${endpoint}upload/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } catch (err) {
                console.error("Upload failed", err);
            }
        }
        await fetchImages();
        setUploading(false);
    }, [endpoint, fetchImages]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

    // Handle Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            setImages(prev => prev.filter(img => img.id !== id)); // Optimistic
            await axios.delete(`${endpoint}${id}/`);
        } catch (error) {
            console.error("Delete failed", error);
            fetchImages(); // Revert
        }
    };

    // Handle Drag End (Reorder)
    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(images);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic UI Update
        const updatedItems = items.map((item, index) => ({ ...item, order: index }));
        setImages(updatedItems);

        try {
            await axios.patch(`${endpoint}${reorderedItem.id}/reorder/`, {
                order: result.destination.index
            });
        } catch (err) {
            console.error("Reorder failed", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                    Photo Gallery
                </h2>
                <span className="text-sm text-slate-500 font-medium">{images.length} photos</span>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={clsx(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group",
                    isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform">
                        {uploading ? <Loader2 className="animate-spin w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="gallery" direction="horizontal">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            <AnimatePresence>
                                {images.map((img, index) => (
                                    <Draggable key={img.id} draggableId={String(img.id)} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={clsx(
                                                    "relative aspect-square group rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100",
                                                    snapshot.isDragging && "shadow-2xl ring-2 ring-indigo-500 rotate-2 z-50 scale-105"
                                                )}
                                            >
                                                {/* Image */}
                                                <motion.img
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    src={img.image}
                                                    alt="User upload"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onClick={() => setLightboxImage(img.image)}
                                                />

                                                {/* Overlays */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                                    <div {...provided.dragHandleProps} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 cursor-grab active:cursor-grabbing">
                                                        <Move size={18} />
                                                    </div>
                                                    <button
                                                        onClick={() => setLightboxImage(img.image)}
                                                        className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-blue-500/80 transition-colors"
                                                    >
                                                        <ZoomIn size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(img.id)}
                                                        className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                            </AnimatePresence>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                        onClick={() => setLightboxImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={lightboxImage}
                            className="max-h-screen max-w-full rounded-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute top-6 right-6 text-white/50 hover:text-white"
                            onClick={() => setLightboxImage(null)}
                        >
                            <X size={40} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
