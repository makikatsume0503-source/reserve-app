'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function Home() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Realtime listener
    const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customers: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.includes(searchTerm) || (c.kana && c.kana.includes(searchTerm))
  );

  // Group by Aiueo
  const groupedCustomers = {
    'あ行': [], 'か行': [], 'さ行': [], 'た行': [], 'な行': [],
    'は行': [], 'ま行': [], 'や行': [], 'ら行': [], 'わ行': [], '他': []
  };

  const getRow = (kana) => {
    if (!kana) return '他';
    const firstChar = kana.charAt(0);
    if (/[ア-オ]/.test(firstChar)) return 'あ行';
    if (/[カ-コガ-ゴ]/.test(firstChar)) return 'か行';
    if (/[サ-ソザ-ゾ]/.test(firstChar)) return 'さ行';
    if (/[タ-トダ-ド]/.test(firstChar)) return 'た行';
    if (/[ナ-ノ]/.test(firstChar)) return 'な行';
    if (/[ハ-ホバ-ボパ-ポ]/.test(firstChar)) return 'は行';
    if (/[マ-モ]/.test(firstChar)) return 'ま行';
    if (/[ヤ-ヨ]/.test(firstChar)) return 'や行';
    if (/[ラ-ロ]/.test(firstChar)) return 'ら行';
    if (/[ワ-ン]/.test(firstChar)) return 'わ行';
    return '他';
  };

  filteredCustomers.forEach(customer => {
    const row = getRow(customer.kana);
    groupedCustomers[row].push(customer);
  });

  // Sort customers within groups
  Object.keys(groupedCustomers).forEach(key => {
    groupedCustomers[key].sort((a, b) => (a.kana || '').localeCompare(b.kana || '', 'ja'));
  });

  const handleExportAll = () => {
    if (customers.length === 0) {
      alert('出力するデータがありません。');
      return;
    }

    // Header
    const headers = ['お客様ID', 'お名前', 'フリガナ', '電話番号', '来店回数'];

    // Rows
    const csvContent = [
      headers.join(','),
      ...customers.map(c =>
        `${c.id},"${c.name}","${c.kana}","${c.phone || ''}",${c.visitCount}`
      )
    ].join('\n');

    // Download
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `全顧客リスト_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', marginTop: '10px' }}>
        <h1 style={{ color: 'var(--primary-pink)', fontSize: '1.5rem', margin: 0 }}>顧客リスト</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportAll} style={{ fontSize: '0.8rem', padding: '8px 12px', background: 'var(--text-main)', color: 'white', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>
            全顧客CSV
          </button>
          <Link href="/customers/add" className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '5px' }}>+</span> 新規
          </Link>
        </div>
      </header>

      <div style={{ marginBottom: '30px' }}>
        <input
          type="search"
          placeholder="名前で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '25px', border: '1px solid #ddd', fontSize: '1rem', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)' }}
        />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>読み込み中...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {Object.entries(groupedCustomers).map(([row, list]) => {
            if (list.length === 0) return null;
            return (
              <div key={row}>
                <h3 style={{
                  borderBottom: '2px solid var(--primary-pink)',
                  color: 'var(--primary-pink)',
                  paddingBottom: '5px',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>
                  {row}
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {list.map((customer) => {
                    const isNextDiscount = (customer.visitCount + 1) % 10 === 0;
                    return (
                      <Link key={customer.id} href={`/customers/${customer.id}`} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{
                            width: '40px', height: '40px',
                            background: 'var(--light-pink)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary-pink)', fontWeight: 'bold'
                          }}>
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <h3 style={{ margin: '0 0 2px 0', fontSize: '1rem' }}>{customer.name}</h3>
                              {isNextDiscount && (
                                <span style={{
                                  backgroundColor: 'var(--accent-gold)',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 'bold'
                                }}>
                                  次回10%オフ
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              {customer.kana}
                            </span>
                          </div>
                        </div>
                        <span style={{ color: 'var(--primary-pink)' }}>→</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>
              {searchTerm ? '見つかりませんでした。' : '顧客が登録されていません。右上の「新規」から登録してください。'}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
