/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppointmentType = 'Consultation' | 'Follow-up' | 'Emergency' | 'General';
export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type ContactMethod = 'Call' | 'SMS';

export interface AppointmentData {
  // Basic Information
  fullName: string;
  phoneNumber: string;
  email: string;
  staffId: string;
  department: string;
  reason: string;

  // Appointment Details
  preferredDate: string;
  preferredTime: string;
  staffToSee: string;
  appointmentType: AppointmentType;

  // Additional Information
  priority: PriorityLevel;
  previousVisit: boolean;
  notes: string;
  preferredContact: ContactMethod;

  // Administrative (Auto-generated)
  appointmentId: string;
  bookingDate: string;
  createdBy: string;
}

export type FormStep = 'basic' | 'details' | 'additional' | 'confirm' | 'success';
