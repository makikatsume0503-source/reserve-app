'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function AddCustomer() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        kana: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, 'customers'), {
                ...formData,
                kana: formData.kana || '',
                visitCount: 0,
                history: [],
                createdAt: new Date()
            });
            alert('登録しました！');
            router.push('/');
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '20px' }}>
                <h1 style={{ color: 'var(--primary-pink)' }}>新規顧客登録</h1>
            </header>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-light)' }}>お名前</label>
                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="山田 花子"
                        value={formData.name}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-light)' }}>フリガナ</label>
                    <input
                        type="text"
                        name="kana"
                        required
                        placeholder="ヤマダ ハナコ"
                        value={formData.kana}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-light)' }}>電話番号</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="090-1234-5678"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-light)' }}>メールアドレス</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="example@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '10px' }}>
                    {loading ? '保存中...' : '登録する'}
                </button>
            </form>
        </main>
    );
}
