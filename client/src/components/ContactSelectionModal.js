import React from 'react';
import AddressBook from './AddressBook';

function ContactSelectionModal({ show, onClose, onSelectContact }) {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select Contact</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <AddressBook 
              onSelectContact={(contact) => {
                onSelectContact(contact);
                onClose();
              }} 
              isModal={true} 
            />
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
}

export default ContactSelectionModal;
