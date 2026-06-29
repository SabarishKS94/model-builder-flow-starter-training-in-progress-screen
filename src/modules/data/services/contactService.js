/**
 * Contact Service — async boundary between page components and data access.
 *
 * In the starter kit this calls local fixtures. In production this becomes
 * a Connect API client or @wire adapter. Page components import from here,
 * never from raw data modules directly.
 */

import { getAllContacts as _getAll, getContactById as _getById } from 'data/contacts';

/**
 * @typedef {Object} Contact
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {string} company
 * @property {string} email
 * @property {string} phone
 * @property {string} mobile
 * @property {string} department
 * @property {string} mailingStreet
 * @property {string} mailingCity
 * @property {string} mailingState
 * @property {string} mailingZip
 * @property {string} description
 */

/** @returns {Promise<Contact[]>} */
export async function listContacts() {
    return _getAll();
}

/** @returns {Promise<Contact|null>} */
export async function getContact(id) {
    return _getById(id);
}
