import React, { useState, useRef, useEffect, memo } from 'react'
import { Search, User, X } from 'lucide-react'

const UserSearch = memo(({ 
  users = [], 
  selectedUser = null, 
  onSelectUser, 
  onClear,
  placeholder = "Buscar usuario...",
  disabled = false,
  error = null,
  required = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState(users)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.departments?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  // Update search term when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setSearchTerm(selectedUser.full_name || selectedUser.email || '')
    } else {
      setSearchTerm('')
    }
  }, [selectedUser])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowDropdown(true)
    setFocusedIndex(-1)
    
    // Clear selection if user is typing
    if (selectedUser && value !== selectedUser.full_name) {
      onClear?.()
    }
  }

  const handleSelectUser = (user) => {
    onSelectUser(user)
    setSearchTerm(user.full_name || user.email || '')
    setShowDropdown(false)
    setFocusedIndex(-1)
  }

  const handleClear = () => {
    setSearchTerm('')
    setShowDropdown(false)
    setFocusedIndex(-1)
    onClear?.()
    searchInputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && filteredUsers[focusedIndex]) {
          handleSelectUser(filteredUsers[focusedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setFocusedIndex(-1)
        searchInputRef.current?.blur()
        break
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">
        <User size={16} />
        Usuario {required && <span style={{ color: 'var(--rojo)' }}>*</span>}
      </label>
      
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={searchInputRef}
            type="text"
            className={`form-input ${error ? 'error' : ''}`}
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-label="Buscar usuario"
          />
          
          {selectedUser ? (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minWidth: 'auto', padding: '0.75rem' }}
              onClick={handleClear}
              disabled={disabled}
              title="Limpiar selección"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minWidth: 'auto', padding: '0.75rem' }}
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={disabled}
              title="Mostrar/ocultar lista de usuarios"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="form-error" style={{ marginTop: '0.25rem' }}>
            {error}
          </div>
        )}
        
        {/* Selected User Display */}
        {selectedUser && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.75rem', 
            background: 'var(--verde-claro)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <User size={16} style={{ color: 'var(--verde)' }} />
            <span style={{ fontWeight: '600', color: 'var(--verde-oscuro)' }}>
              {selectedUser.full_name || selectedUser.email}
            </span>
            {selectedUser.departments?.name && (
              <span style={{ 
                background: 'var(--verde)', 
                color: 'var(--blanco)', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '12px',
                fontSize: '0.75rem'
              }}>
                {selectedUser.departments.name}
              </span>
            )}
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && filteredUsers.length > 0 && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--blanco)',
              border: '2px solid var(--borde-verde)',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              marginTop: '0.25rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            role="listbox"
          >
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                role="option"
                aria-selected={index === focusedIndex}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  borderBottom: index < filteredUsers.length - 1 ? '1px solid var(--borde-verde)' : 'none',
                  background: index === focusedIndex ? 'var(--verde-claro)' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onClick={() => handleSelectUser(user)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div style={{ fontWeight: '600' }}>
                  {user.full_name || user.email}
                </div>
                {user.departments?.name && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--gris-medio)' }}>
                    {user.departments.name}
                  </div>
                )}
                {user.email && user.full_name && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--gris-medio)' }}>
                    {user.email}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showDropdown && searchTerm && filteredUsers.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--blanco)',
            border: '2px solid var(--borde-verde)',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--gris-medio)',
            zIndex: 1000,
            marginTop: '0.25rem'
          }}>
            No se encontraron usuarios que coincidan con "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  )
})

UserSearch.displayName = 'UserSearch'

export default UserSearch