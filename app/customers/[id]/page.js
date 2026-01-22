'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function CustomerDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState(null);
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [visitNote, setVisitNote] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const docRef = doc(db, 'customers', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCustomer({ id: docSnap.id, ...docSnap.data() });
                } else {
                    alert('顧客が見つかりませんでした。');
                    router.push('/');
                }
            } catch (error) {
                console.error("Error fetching customer:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCustomer();
    }, [id, router]);

    if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;
    if (!customer) return null;

    const isDiscountVisit = (customer.visitCount + 1) % 10 === 0;

    const handleAddVisit = async () => {
        if (!visitDate) {
            alert('日付を選択してください');
            return;
        }

        const newRecord = { date: visitDate, note: visitNote };
        const newHistory = [newRecord, ...(customer.history || [])];
        const newCount = (customer.visitCount || 0) + 1;

        try {
            const docRef = doc(db, 'customers', id);
            await updateDoc(docRef, {
                visitCount: newCount,
                history: newHistory
            });

            // Update local state
            setCustomer(prev => ({
                ...prev,
                visitCount: newCount,
                history: newHistory
            }));

            alert('記録しました！');
            setVisitNote('');
        } catch (error) {
            console.error("Error updating visit:", error);
            alert('記録に失敗しました。');
        }
    };

    const handleDelete = async () => {
        if (confirm('本当にこの顧客情報を削除しますか？\n※この操作は元に戻せません。')) {
            try {
                await deleteDoc(doc(db, 'customers', id));
                alert('削除しました。');
                router.push('/');
            } catch (error) {
                console.error("Error deleting customer:", error);
                alert('削除に失敗しました。');
            }
        }
    };

    const handleExportCSV = () => {
        if (!customer.history || customer.history.length === 0) {
            alert('出力する記録がありません。');
            return;
        }

        const headers = ['日付', '施術内容'];
        const csvContent = [
            headers.join(','),
            ...customer.history.map(row => `${row.date},"${(row.note || '').replace(/"/g, '""')}"`)
        ].join('\n');

        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${customer.name}_施術記録.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
            <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ color: 'var(--primary-pink)', marginBottom: '5px' }}>{customer.name} 様</h1>
                    <p style={{ color: 'var(--text-light)', margin: 0 }}>{customer.phone || '電話番号なし'}</p>
                </div>
                <button onClick={handleDelete} style={{ background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', borderRadius: '4px', padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    削除
                </button>
            </header>

            {/* Discount Card */}
            <div className="card" style={{
                textAlign: 'center',
                marginBottom: '30px',
                background: isDiscountVisit ? 'linear-gradient(135deg, #FF9999 0%, #D4AF37 100%)' : 'white',
                color: isDiscountVisit ? 'white' : 'inherit'
            }}>
                <h2 style={{ fontSize: '3rem', margin: '10px 0', color: isDiscountVisit ? 'white' : 'var(--primary-pink)' }}>
                    {customer.visitCount} <span style={{ fontSize: '1rem' }}>回</span>
                </h2>
                {isDiscountVisit ? (
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}>
                        🎉 次回 10% OFF! 🎉
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-light)' }}>
                        あと {10 - (customer.visitCount % 10)} 回で割引です
                    </p>
                )}
            </div>

            {/* Record Input */}
            <div style={{ marginBottom: '30px' }} className="card">
                <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--primary-pink)' }}>来店を記録する</h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        施術日
                    </label>
                    <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        施術内容（メモ）
                    </label>
                    <textarea
                        rows="3"
                        placeholder="例：カット、ネイルのデザインなど"
                        value={visitNote}
                        onChange={(e) => setVisitNote(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                    />
                </div>

                <button onClick={handleAddVisit} className="btn-primary" style={{ width: '100%' }}>
                    記録する
                </button>
            </div>

            {/* History List */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ borderLeft: '4px solid var(--primary-pink)', paddingLeft: '10px', margin: 0 }}>過去の施術記録</h3>
                    <button onClick={handleExportCSV} style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'var(--text-main)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                        CSV出力
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    {customer.history && customer.history.length > 0 ? (
                        customer.history.map((record, index) => (
                            <div key={index} className="card" style={{ padding: '15px', borderLeft: index === 0 ? '4px solid var(--accent-gold)' : '1px solid var(--light-pink)' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>{record.date}</div>
                                <div style={{ color: 'var(--text-light)', whiteSpace: 'pre-wrap' }}>{record.note || '（メモなし）'}</div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>まだ記録がありません。</p>
                    )}
                </div>
            </div>
        </main>
    );
}
