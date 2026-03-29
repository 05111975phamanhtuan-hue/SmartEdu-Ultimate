// src/components/social/Feed.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Post from './Post';
import CreatePost from './CreatePost';
import { useInView } from 'react-intersection-observer';

const Feed = () => {
  const { api } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ subject: 'all', grade: null });
  
  const { ref, inView } = useInView();
  
  const fetchPosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        subject: filter.subject,
        ...(filter.grade && { grade: filter.grade })
      });
      const response = await api.get(`/social/feed?${params}`);
      
      if (page === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts(prev => [...prev, ...response.data.posts]);
      }
      
      setHasMore(response.data.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, filter]);
  
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setPosts([]);
    fetchPosts();
  }, [filter]);
  
  useEffect(() => {
    if (inView) {
      fetchPosts();
    }
  }, [inView]);
  
  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };
  
  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };
  
  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <CreatePost onPostCreated={handleNewPost} />
      
      <div className="mt-4 space-y-4">
        {posts.map(post => (
          <Post
            key={post._id}
            post={post}
            onUpdate={handlePostUpdate}
            onDelete={handlePostDelete}
          />
        ))}
      </div>
      
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}
      
      {hasMore && <div ref={ref} className="h-10" />}
      
      {!hasMore && posts.length > 0 && (
        <div className="text-center text-gray-500 py-4">
          Đã xem hết bài viết
        </div>
      )}
      
      {posts.length === 0 && !loading && (
        <div className="text-center py-10 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p>Chưa có bài viết nào</p>
          <p className="text-sm">Hãy là người đầu tiên đăng bài!</p>
        </div>
      )}
    </div>
  );
};

export default Feed;