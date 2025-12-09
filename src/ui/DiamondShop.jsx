/**
 * 💎 Diamond Shop - Use diamonds to purchase boosters, coins, and revives
 * Integrated with the engagement system
 */

import React, { useState } from 'react';

const DiamondShop = ({
    totalGems,
    totalCoins,
    onPurchase,  // (itemId, cost, reward) => void
    onClose
}) => {
    const [purchaseAnimation, setPurchaseAnimation] = useState(null);
    const [error, setError] = useState(null);

    // Shop items available for purchase with diamonds
    const shopItems = [
        // Coins packages
        {
            id: 'coins_small',
            category: 'coins',
            name: '500 Coins',
            description: 'A small pile of gold',
            icon: '🪙',
            cost: 10,
            reward: { type: 'coins', amount: 500 }
        },
        {
            id: 'coins_medium',
            category: 'coins',
            name: '2,500 Coins',
            description: 'A bag of gold',
            icon: '💰',
            cost: 40,
            reward: { type: 'coins', amount: 2500 }
        },
        {
            id: 'coins_large',
            category: 'coins',
            name: '10,000 Coins',
            description: 'A treasure chest!',
            icon: '📦',
            cost: 150,
            reward: { type: 'coins', amount: 10000 },
            bestValue: true
        },

        // Revive tokens
        {
            id: 'revive_1',
            category: 'revives',
            name: '1 Revive',
            description: 'Continue your run once',
            icon: '❤️',
            cost: 15,
            reward: { type: 'revives', amount: 1 }
        },
        {
            id: 'revive_3',
            category: 'revives',
            name: '3 Revives',
            description: 'Triple the chances',
            icon: '💕',
            cost: 40,
            reward: { type: 'revives', amount: 3 }
        },
        {
            id: 'revive_10',
            category: 'revives',
            name: '10 Revives',
            description: 'Never give up!',
            icon: '💗',
            cost: 100,
            reward: { type: 'revives', amount: 10 },
            bestValue: true
        },

        // Boosters (one-time use power-ups that start with you)
        {
            id: 'booster_magnet',
            category: 'boosters',
            name: 'Magnet Start',
            description: 'Start with 30s magnet',
            icon: '🧲',
            cost: 8,
            reward: { type: 'booster', boosterType: 'magnet', duration: 30 }
        },
        {
            id: 'booster_shield',
            category: 'boosters',
            name: 'Shield Start',
            description: 'Start with 20s shield',
            icon: '🛡️',
            cost: 12,
            reward: { type: 'booster', boosterType: 'shield', duration: 20 }
        },
        {
            id: 'booster_multiplier',
            category: 'boosters',
            name: '2x Coins Start',
            description: 'Start with 45s coin multiplier',
            icon: '✨',
            cost: 10,
            reward: { type: 'booster', boosterType: 'multiplier', duration: 45 }
        },
        {
            id: 'booster_bundle',
            category: 'boosters',
            name: 'Ultimate Start',
            description: 'Magnet + Shield + 2x Coins',
            icon: '🚀',
            cost: 25,
            reward: { type: 'booster_bundle', boosters: ['magnet', 'shield', 'multiplier'] },
            bestValue: true
        }
    ];

    const handlePurchase = (item) => {
        if (totalGems < item.cost) {
            setError('Not enough diamonds!');
            setTimeout(() => setError(null), 2000);
            return;
        }

        setPurchaseAnimation(item.id);

        // Call the purchase handler
        if (onPurchase) {
            onPurchase(item.id, item.cost, item.reward);
        }

        setTimeout(() => {
            setPurchaseAnimation(null);
        }, 1000);
    };

    const categories = [
        { id: 'coins', name: '💰 Coins', description: 'Buy gold coins' },
        { id: 'revives', name: '❤️ Revives', description: 'Continue your run' },
        { id: 'boosters', name: '🚀 Boosters', description: 'Power-up starts' }
    ];

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>💎 Diamond Shop</h2>
                    <div style={styles.balance}>
                        <span style={styles.diamondIcon}>💎</span>
                        <span style={styles.balanceAmount}>{totalGems}</span>
                    </div>
                    <button style={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                {/* Error message */}
                {error && (
                    <div style={styles.error}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Shop content */}
                <div style={styles.content}>
                    {categories.map(category => (
                        <div key={category.id} style={styles.category}>
                            <h3 style={styles.categoryTitle}>{category.name}</h3>
                            <div style={styles.itemsGrid}>
                                {shopItems
                                    .filter(item => item.category === category.id)
                                    .map(item => (
                                        <div
                                            key={item.id}
                                            style={{
                                                ...styles.item,
                                                ...(item.bestValue ? styles.bestValue : {}),
                                                ...(purchaseAnimation === item.id ? styles.purchasing : {})
                                            }}
                                            onClick={() => handlePurchase(item)}
                                        >
                                            {item.bestValue && <div style={styles.bestValueBadge}>BEST VALUE</div>}
                                            <div style={styles.itemIcon}>{item.icon}</div>
                                            <div style={styles.itemName}>{item.name}</div>
                                            <div style={styles.itemDescription}>{item.description}</div>
                                            <div style={{
                                                ...styles.itemPrice,
                                                ...(totalGems < item.cost ? styles.insufficientFunds : {})
                                            }}>
                                                💎 {item.cost}
                                            </div>
                                            {purchaseAnimation === item.id && (
                                                <div style={styles.purchaseSuccess}>✓ Purchased!</div>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <span style={styles.footerText}>Tip: Diamonds can be earned from daily rewards and lucky wheel spins!</span>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(8px)'
    },
    modal: {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '85vh',
        overflow: 'hidden',
        border: '2px solid rgba(138, 43, 226, 0.5)',
        boxShadow: '0 0 40px rgba(138, 43, 226, 0.3), inset 0 0 60px rgba(138, 43, 226, 0.1)'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 25px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(90deg, rgba(138, 43, 226, 0.2), transparent)'
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 0 20px rgba(138, 43, 226, 0.8)'
    },
    balance: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 20px',
        background: 'rgba(138, 43, 226, 0.3)',
        borderRadius: '25px',
        border: '1px solid rgba(138, 43, 226, 0.5)'
    },
    diamondIcon: {
        fontSize: '20px'
    },
    balanceAmount: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#e0b0ff'
    },
    closeButton: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        color: '#fff',
        fontSize: '24px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    error: {
        padding: '12px 20px',
        background: 'rgba(255, 100, 100, 0.2)',
        color: '#ff6b6b',
        textAlign: 'center',
        fontWeight: 'bold'
    },
    content: {
        padding: '20px',
        overflowY: 'auto',
        maxHeight: 'calc(85vh - 180px)'
    },
    category: {
        marginBottom: '25px'
    },
    categoryTitle: {
        margin: '0 0 15px 0',
        fontSize: '18px',
        color: '#aaa',
        fontWeight: 'normal'
    },
    itemsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '15px'
    },
    item: {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px 15px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    bestValue: {
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))',
        border: '1px solid rgba(255, 215, 0, 0.4)'
    },
    bestValueBadge: {
        position: 'absolute',
        top: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
        color: '#000',
        padding: '3px 10px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 'bold'
    },
    purchasing: {
        transform: 'scale(0.95)',
        opacity: 0.7
    },
    itemIcon: {
        fontSize: '40px',
        marginBottom: '10px'
    },
    itemName: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '5px'
    },
    itemDescription: {
        fontSize: '12px',
        color: '#888',
        marginBottom: '12px'
    },
    itemPrice: {
        display: 'inline-block',
        padding: '6px 16px',
        background: 'rgba(138, 43, 226, 0.3)',
        borderRadius: '20px',
        color: '#e0b0ff',
        fontWeight: 'bold',
        fontSize: '14px'
    },
    insufficientFunds: {
        background: 'rgba(255, 100, 100, 0.2)',
        color: '#ff6b6b'
    },
    purchaseSuccess: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 200, 100, 0.9)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '10px',
        fontWeight: 'bold',
        fontSize: '16px'
    },
    footer: {
        padding: '15px 25px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
    },
    footerText: {
        fontSize: '12px',
        color: '#666'
    }
};

export default DiamondShop;
