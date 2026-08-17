import type { CSSProperties } from 'react';

export type Styles = {
    container: CSSProperties;
    mapWrapper: CSSProperties;
    absoluteFill: CSSProperties;
    hint: CSSProperties;
    materialsPanel: CSSProperties;
    materialsHero: CSSProperties;
    searchBar: CSSProperties;
    input: CSSProperties;
    grid: CSSProperties;
    emptyState: CSSProperties;
    card: (empty: boolean) => CSSProperties;
    statusPill: (empty: boolean) => CSSProperties;
    chipRow: CSSProperties;
    chip: CSSProperties;
    cardDescription: CSSProperties;
    btnPrimary: CSSProperties;
    pendingPanel: CSSProperties;
    modalBackdrop: CSSProperties;
    modal: CSSProperties;
    buttonRow: CSSProperties;
    primaryBtn: CSSProperties;
    secondaryBtn: CSSProperties;
};

// Pulled out of the old combined UserView so MapView and MaterialSearchView
// can share it without duplicating ~200 lines twice. tabBar/tabBtn were
// dropped on purpose — those belonged to UserView's internal map/materials
// switcher, which no longer exists now that Map and Search are separate
// top-level app tabs.
export const styles: Styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: 'var(--viventory-bg)',
        color: 'var(--viventory-text)'
    },

    mapWrapper: { flex: 1, position: 'relative', overflow: 'hidden' },

    absoluteFill: { position: 'absolute', inset: 0 },

    hint: {
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--viventory-welcome-card)',
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid var(--viventory-border)',
        fontSize: 12,
        color: 'var(--viventory-muted-text)',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)'
    },

    materialsPanel: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 20,
        background: 'var(--viventory-bg)'
    },

    materialsHero: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 18,
        padding: 22,
        marginBottom: 16,
        borderRadius: 8,
        border: '1px solid var(--viventory-border)',
        background: 'var(--viventory-welcome-card)',
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)',
        backdropFilter: 'blur(14px)'
    },

    searchBar: {
        padding: 0,
        marginBottom: 16,
        background: 'transparent'
    },

    input: {
        width: '100%',
        padding: '15px 16px 15px 44px',
        borderRadius: 999,
        border: '1px solid var(--viventory-border)',
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        fontSize: 16,
        fontWeight: 650,
        outline: 'none',
        boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)'
    },

    grid: {
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
    },
    emptyState: {
        padding: 24,
        border: '1px dashed var(--viventory-border)',
        borderRadius: 8,
        color: 'var(--viventory-muted-text)',
        background: 'var(--viventory-welcome-card)',
        fontSize: 15
    },

    card: (empty: boolean) => ({
        background: 'var(--viventory-surface)',
        border: `1px solid ${empty ? 'rgba(239, 111, 77, 0.48)' : 'var(--viventory-border)'}`,
        borderRadius: 8,
        padding: 14,
        opacity: empty ? 0.82 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
    }),

    statusPill: (empty: boolean) => ({
        flexShrink: 0,
        alignSelf: 'flex-start',
        whiteSpace: 'nowrap',
        borderRadius: 999,
        padding: '5px 10px',
        background: empty ? 'rgba(161, 130, 79, 0.16)' : 'rgba(165, 214, 209, 0.26)',
        color: empty ? 'var(--viventory-welcome-accent-2)' : 'var(--viventory-welcome-accent)',
        border: empty ? '1px solid rgba(161, 130, 79, 0.34)' : '1px solid rgba(51, 167, 181, 0.28)',
        fontSize: 12,
        fontWeight: 800
    }),

    chipRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
    },

    chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        maxWidth: '100%',
        borderRadius: 999,
        border: '1px solid var(--viventory-border)',
        background: 'var(--viventory-muted-surface)',
        color: 'var(--viventory-muted-text)',
        padding: '3px 8px',
        fontSize: 11.5,
        fontWeight: 700,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    cardDescription: {
        margin: 0,
        color: 'var(--viventory-muted-text)',
        fontSize: 13,
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    },

    btnPrimary: {
        background: 'linear-gradient(135deg, var(--viventory-welcome-accent), var(--viventory-welcome-accent-2))',
        border: 'none',
        color: '#1f1300',
        padding: '10px 12px',
        borderRadius: 999,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },

    pendingPanel: {
        marginTop: 20,
        padding: 14,
        borderRadius: 8,
        background: 'rgba(165, 214, 209, 0.3)',
        border: '1px solid rgba(51, 167, 181, 0.32)',
        color: 'var(--viventory-text)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: 800
    },

    modalBackdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.52)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        zIndex: 50
    },

    modal: {
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        borderRadius: 8,
        border: '1px solid var(--viventory-border)',
        padding: 22,
        width: '100%',
        maxWidth: 420,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
    },

    buttonRow: {
        display: 'flex',
        gap: 8
    },

    primaryBtn: {
        flex: 1,
        background: 'var(--viventory-welcome-accent)',
        color: '#1f1300',
        border: 'none',
        padding: '10px',
        borderRadius: 999,
        cursor: 'pointer',
        fontWeight: 800
    },

    secondaryBtn: {
        flex: 1,
        background: 'var(--viventory-muted-surface)',
        color: 'var(--viventory-text)',
        border: '1px solid var(--viventory-border)',
        padding: '10px',
        borderRadius: 999,
        cursor: 'pointer'
    }
};