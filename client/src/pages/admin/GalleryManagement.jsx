import { useState, useEffect } from "react";
import { Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function GalleryManagement() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);

    const SERVER_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const res = await api.get("/gallery");
            setImages(res.data);
        } catch (err) {
            toast.error("Failed to fetch gallery images.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            setUploading(true);
            await api.post("/gallery", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            toast.success("Image uploaded successfully!");
            setFile(null);
            // reset file input
            document.getElementById("image-upload").value = "";
            fetchImages();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this image? It will be removed from the Landing Page.")) return;

        try {
            await api.delete(`/gallery/${id}`);
            toast.success("Image deleted.");
            fetchImages();
        } catch (err) {
            toast.error("Failed to delete image.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gallery Management</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Add or remove images from the public landing page gallery.</p>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-blue-500" /> Upload New Image
                </h2>

                <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Image File</label>
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-sm text-slate-500
                file:mr-4 file:py-3 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition-all border border-slate-200 rounded-xl"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                    >
                        {uploading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            "Upload Image"
                        )}
                    </button>
                </form>
            </div>

            {/* Gallery Grid */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <ImageIcon size={20} className="text-indigo-500" /> Current Gallery Images
                </h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : images.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-sm font-bold text-slate-900">No images yet</h3>
                        <p className="text-sm text-slate-500 mt-1">Upload an image above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {images.map((img) => (
                            <div key={img.id} className="group relative rounded-xl overflow-hidden shadow-sm border border-slate-200 aspect-[4/3] bg-slate-100">
                                <img
                                    src={img.image_url.startsWith('http') ? img.image_url : SERVER_URL + img.image_url}
                                    alt="Gallery Item"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDelete(img.id)}
                                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100"
                                        title="Delete Image"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
