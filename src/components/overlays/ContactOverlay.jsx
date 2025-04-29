/**
 * Overlay de formulaire de contact
 * Affiche un formulaire de contact dans un overlay latéral
 */
import React, { useState, memo } from 'react';
import PropTypes from 'prop-types';
import BaseOverlay from '../common/BaseOverlay';
import useDeviceDetection from '../../hooks/useDeviceDetection';

/**
 * Overlay de formulaire de contact
 */
const ContactOverlay = ({ onClose, isMobile }) => {
  const { isTablet } = useDeviceDetection();
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  // État pour le statut d'envoi
  const [submitStatus, setSubmitStatus] = useState(null);
  
  // Gestionnaire de changement des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Gestionnaire de soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simuler l'envoi du message
    setSubmitStatus('loading');
    
    // Simulation d'une requête API (à remplacer par votre logique d'envoi réelle)
    setTimeout(() => {
      setSubmitStatus('success');
      
      // Réinitialiser le formulaire après succès
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Réinitialiser le statut après un délai
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }, 1500);
  };
  
  // Styles pour le formulaire
  const styles = {
    form: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    inputGroup: {
      marginBottom: '15px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '0.9rem',
      color: '#555',
      fontWeight: '500'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid rgba(42, 157, 143, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid rgba(42, 157, 143, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      fontSize: '1rem',
      minHeight: '150px',
      resize: 'vertical',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
    },
    submitButton: {
      backgroundColor: '#2A9D8F',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      marginTop: '10px'
    },
    statusContainer: {
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    loadingStatus: {
      backgroundColor: 'rgba(42, 157, 143, 0.1)',
      border: '1px solid rgba(42, 157, 143, 0.3)'
    },
    successStatus: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      color: '#10b981'
    },
    errorStatus: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#ef4444'
    },
    contactInfo: {
      marginTop: '30px',
      padding: '20px',
      backgroundColor: 'rgba(42, 157, 143, 0.05)',
      borderRadius: '10px',
      marginBottom: '20px'
    },
    contactInfoTitle: {
      fontSize: '1.2rem',
      color: '#2A9D8F',
      marginBottom: '15px',
      fontWeight: '500'
    },
    contactInfoItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px'
    },
    contactInfoIcon: {
      marginRight: '15px',
      fontSize: '1.2rem',
      color: '#2A9D8F'
    },
    contactInfoText: {
      fontSize: '0.95rem',
      color: '#555'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666',
      marginBottom: '20px',
      lineHeight: '1.5'
    }
  };

  return (
    <BaseOverlay 
      title="CONTACT" 
      onClose={onClose}
      showCloseButton={true}
      animationDelay={200}
    >
      <p style={styles.subtitle}>
        Nous sommes à votre écoute ! Utilisez ce formulaire pour nous contacter à propos de vos projets, demandes de devis ou toute question.
      </p>
      
      {/* Affichage du statut */}
      {submitStatus && (
        <div 
          style={{
            ...styles.statusContainer,
            ...(submitStatus === 'loading' ? styles.loadingStatus : 
               submitStatus === 'success' ? styles.successStatus : 
               styles.errorStatus)
          }}
        >
          {submitStatus === 'loading' && (
            <p>Envoi de votre message en cours...</p>
          )}
          {submitStatus === 'success' && (
            <p>Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.</p>
          )}
          {submitStatus === 'error' && (
            <p>Une erreur est survenue lors de l'envoi. Veuillez réessayer ou nous contacter directement.</p>
          )}
        </div>
      )}
      
      {/* Formulaire de contact */}
      <form 
        style={styles.form}
        onSubmit={handleSubmit}
      >
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="name">
            Nom complet
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.8)';
              e.target.style.boxShadow = '0 0 0 3px rgba(42, 157, 143, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.8)';
              e.target.style.boxShadow = '0 0 0 3px rgba(42, 157, 143, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="subject">
            Sujet
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.8)';
              e.target.style.boxShadow = '0 0 0 3px rgba(42, 157, 143, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            style={styles.textarea}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.8)';
              e.target.style.boxShadow = '0 0 0 3px rgba(42, 157, 143, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(42, 157, 143, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <button 
          type="submit"
          style={styles.submitButton}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#45b4a6';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#2A9D8F';
          }}
          disabled={submitStatus === 'loading'}
        >
          {submitStatus === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
        </button>
      </form>
      
      {/* Informations de contact */}
      <div style={styles.contactInfo}>
        <h3 style={styles.contactInfoTitle}>Informations de contact</h3>
        
        <div style={styles.contactInfoItem}>
          <span style={styles.contactInfoIcon}>📞</span>
          <span style={styles.contactInfoText}>+33 1 23 45 67 89</span>
        </div>
        
        <div style={styles.contactInfoItem}>
          <span style={styles.contactInfoIcon}>✉️</span>
          <span style={styles.contactInfoText}>contact@studio-timorne.com</span>
        </div>
        
        <div style={styles.contactInfoItem}>
          <span style={styles.contactInfoIcon}>📍</span>
          <span style={styles.contactInfoText}>Studio Ti Morne, 97200 Fort-de-France</span>
        </div>
      </div>
    </BaseOverlay>
  );
};

ContactOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  isMobile: PropTypes.bool
};

export default memo(ContactOverlay);