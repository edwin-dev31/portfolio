import { CanDeactivateFn } from '@angular/router';

/**
 * Interface for components that can be deactivated
 * Components must implement this interface to use the canDeactivate guard
 */
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

/**
 * CanDeactivate Guard
 * 
 * Prevents navigation away from a component if it has unsaved changes.
 * The component must implement the CanComponentDeactivate interface.
 * 
 * Usage in routes:
 * {
 *   path: 'edit/:id',
 *   component: ProjectEditorComponent,
 *   canDeactivate: [canDeactivateGuard]
 * }
 * 
 * Requirements: 7.8
 */
export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component: CanComponentDeactivate
) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};
