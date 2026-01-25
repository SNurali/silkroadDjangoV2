import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api from '../services/api';

export default function Blog() {
    const { t } = useTranslation();

    const [posts, setPosts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        api.get('/blog/')
            .then(res => {
                setPosts(res.data.results || res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch blog", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-4">
                <header className="text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase italic tracking-tighter"
                    >
                        <Trans i18nKey="blog.title">
                            The <span className="text-blue-600">Travel</span> Blog
                        </Trans>
                    </motion.h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        {t('blog.subtitle')}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {posts.map((post, i) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600">
                                    {post.category}
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                                    <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                                    {post.title}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6 flex-1">
                                    {post.excerpt}
                                </p>

                                <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors py-2 group/link">
                                    {t('blog.read_article')}
                                    <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.article>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <button className="px-12 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all uppercase tracking-widest text-xs">
                        {t('blog.load_more')}
                    </button>
                </div>
            </div>
        </div>
    );
}
