import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Données du formulaire soumises:", formData);
    
    // Simuler l'envoi d'un message (à remplacer par votre logique d'envoi réelle)
    setTimeout(() => {
      setSubmitStatus('success');
      // Réinitialiser le formulaire après succès
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1000);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate(-1)} // Retourne à la page précédente
          style={{
            background: 'rgba(59, 130, 246, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          <span>←</span> Retour
        </button>
      </div>

      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '40px',
        background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 197, 253, 0.8))',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        textAlign: 'center'
      }}>
        Contactez-nous
      </h1>

      <div style={{
        width: '100%',
        maxWidth: '600px',
        background: 'rgba(30, 41, 59, 0.9)',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        {submitStatus === 'success' ? (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '5px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#10b981' }}>
              Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
            </p>
            <button
              onClick={() => setSubmitStatus(null)}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 15px',
                marginTop: '15px',
                cursor: 'pointer'
              }}
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="name"
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                Nom complet
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '5px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="email"
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '5px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="subject"
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                Sujet
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '5px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label 
                htmlFor="message"
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '5px',
                  color: 'white',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                border: 'none',
                borderRadius: '5px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.9)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)'}
            >
              Envoyer le message
            </button>
          </form>
        )}
      </div>

      <div style={{
        marginTop: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px'
      }}>
        <h2 style={{ 
          fontSize: '1.8rem',
          marginBottom: '15px',
          color: 'rgba(59, 130, 246, 0.9)'
        }}>
          Informations de contact
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          width: '100%',
          marginTop: '10px'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📱</div>
            <h3 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>Téléphone</h3>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
              +33 1 23 45 67 89
            </p>
          </div>
          
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>✉️</div>
            <h3 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>Email</h3>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
              contact@votre-domaine.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}