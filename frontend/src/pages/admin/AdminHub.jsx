import React from 'react'
import {
  FiTag,
  FiGitBranch,
  FiImage,
  FiStar,
  FiBox,
  FiShoppingBag,
  FiUsers,
  FiExternalLink,
  FiChevronRight
} from 'react-icons/fi'

export default function AdminHub({ onSelectTab }) {
  const hubModules = [
    {
      id: 'categories',
      title: 'Categories',
      desc: 'Create, organize, and toggle main catalog categories & logos',
      icon: <FiTag />,
      badge: 'Catalog'
    },
    {
      id: 'subcategories',
      title: 'Subcategories',
      desc: 'Manage nested subcategories mapped to parent departments',
      icon: <FiGitBranch />,
      badge: 'Catalog'
    },
    {
      id: 'banners',
      title: 'Promotional Banners',
      desc: 'Mobile hero carousels, seasonal offers, and marketing slides',
      icon: <FiImage />,
      badge: 'Marketing'
    },
    {
      id: 'reviews',
      title: 'Customer Reviews',
      desc: 'Moderate product feedback, star ratings, and buyer comments',
      icon: <FiStar />,
      badge: 'Moderation'
    },
    {
      id: 'products',
      title: 'Inventory & Products',
      desc: 'Manage pricing, bulk wholesale tiers, and stock levels',
      icon: <FiBox />,
      badge: 'Stock'
    },
    {
      id: 'orders',
      title: 'Order Fulfillment',
      desc: 'Dispatch queue, delivery tracking, and live socket sync',
      icon: <FiShoppingBag />,
      badge: 'Orders'
    },
    {
      id: 'users',
      title: 'User Accounts',
      desc: 'Customer base, retailer approvals, and account access',
      icon: <FiUsers />,
      badge: 'Accounts'
    }
  ]

  return (
    <div className="adminPage adminHub">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Admin Operations Hub</h1>
          <p className="adminPageHeader__subtitle">
            Instant access to all store management modules and catalogs
          </p>
        </div>
      </div>

      <div className="adminHubGrid">
        {hubModules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            className="adminHubTile"
            onClick={() => onSelectTab(mod.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div className="adminHubTile__icon">{mod.icon}</div>
              <span className="adminBadge" style={{ fontSize: '0.7rem' }}>{mod.badge}</span>
            </div>
            <div>
              <div className="adminHubTile__title">{mod.title}</div>
              <div className="adminHubTile__desc">{mod.desc}</div>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 800 }}>
              <span>Open Module</span>
              <FiChevronRight />
            </div>
          </button>
        ))}

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="adminHubTile"
          style={{ textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div className="adminHubTile__icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FiExternalLink />
            </div>
            <span className="adminBadge" style={{ fontSize: '0.7rem' }}>Storefront</span>
          </div>
          <div>
            <div className="adminHubTile__title">Customer Store</div>
            <div className="adminHubTile__desc">Preview the live storefront as experienced by shoppers</div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: '#2563eb', fontSize: '0.78rem', fontWeight: 800 }}>
            <span>Visit Store</span>
            <FiChevronRight />
          </div>
        </a>
      </div>
    </div>
  )
}
