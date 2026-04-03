'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TourPlacement, TooltipPosition } from './types';

const TOOLTIP_WIDTH = 300;
const TOOLTIP_HEIGHT_ESTIMATE = 180;
const VIEWPORT_PADDING = 12;
const ARROW_SIZE = 12;
const GAP = 10; // space between target and tooltip

interface PositionInput {
  targetSelector: string | null;
  preferredPlacement: TourPlacement;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}

function computePosition(
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferred: TourPlacement
): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scrollY = window.scrollY;

  // Available space in each direction
  const spaceTop = targetRect.top;
  const spaceBottom = vh - targetRect.bottom;
  const spaceLeft = targetRect.left;
  const spaceRight = vw - targetRect.right;

  const neededVertical = tooltipHeight + GAP + ARROW_SIZE;
  const neededHorizontal = tooltipWidth + GAP + ARROW_SIZE;

  // Determine placement
  let placement: 'top' | 'bottom' | 'left' | 'right';
  if (preferred !== 'auto') {
    placement = preferred;
    // Flip if not enough space
    if (placement === 'bottom' && spaceBottom < neededVertical && spaceTop >= neededVertical) {
      placement = 'top';
    } else if (placement === 'top' && spaceTop < neededVertical && spaceBottom >= neededVertical) {
      placement = 'bottom';
    } else if (
      placement === 'right' &&
      spaceRight < neededHorizontal &&
      spaceLeft >= neededHorizontal
    ) {
      placement = 'left';
    } else if (
      placement === 'left' &&
      spaceLeft < neededHorizontal &&
      spaceRight >= neededHorizontal
    ) {
      placement = 'right';
    }
  } else {
    // Auto: prefer bottom, then top, then right, then left
    if (spaceBottom >= neededVertical) placement = 'bottom';
    else if (spaceTop >= neededVertical) placement = 'top';
    else if (spaceRight >= neededHorizontal) placement = 'right';
    else placement = 'bottom'; // fallback
  }

  let top = 0;
  let left = 0;
  let arrowLeft = 0;
  let arrowTop = 0;

  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  if (placement === 'bottom') {
    top = targetRect.bottom + GAP + ARROW_SIZE / 2 + scrollY;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(targetCenterX - tooltipWidth / 2, vw - tooltipWidth - VIEWPORT_PADDING)
    );
    arrowLeft = Math.max(16, Math.min(targetCenterX - left, tooltipWidth - 16));
    arrowTop = -ARROW_SIZE / 2 - 1;
  } else if (placement === 'top') {
    top = targetRect.top - tooltipHeight - GAP - ARROW_SIZE / 2 + scrollY;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(targetCenterX - tooltipWidth / 2, vw - tooltipWidth - VIEWPORT_PADDING)
    );
    arrowLeft = Math.max(16, Math.min(targetCenterX - left, tooltipWidth - 16));
    arrowTop = tooltipHeight - 1;
  } else if (placement === 'right') {
    top = Math.max(
      VIEWPORT_PADDING + scrollY,
      Math.min(
        targetCenterY - tooltipHeight / 2 + scrollY,
        vh - tooltipHeight - VIEWPORT_PADDING + scrollY
      )
    );
    left = targetRect.right + GAP + ARROW_SIZE / 2;
    arrowLeft = -ARROW_SIZE / 2 - 1;
    arrowTop = Math.max(16, Math.min(targetCenterY + scrollY - top, tooltipHeight - 16));
  } else {
    // left
    top = Math.max(
      VIEWPORT_PADDING + scrollY,
      Math.min(
        targetCenterY - tooltipHeight / 2 + scrollY,
        vh - tooltipHeight - VIEWPORT_PADDING + scrollY
      )
    );
    left = targetRect.left - tooltipWidth - GAP - ARROW_SIZE / 2;
    arrowLeft = tooltipWidth - 1;
    arrowTop = Math.max(16, Math.min(targetCenterY + scrollY - top, tooltipHeight - 16));
  }

  return { top, left, actualPlacement: placement, arrowLeft, arrowTop };
}

export function useTourPositioning({
  targetSelector,
  preferredPlacement,
  tooltipRef,
}: PositionInput) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const rafRef = useRef<number>(0);

  const update = useCallback(() => {
    if (!targetSelector) {
      setPosition(null);
      return;
    }

    const target = document.querySelector(targetSelector);
    if (!target) {
      setPosition(null);
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    const tooltipWidth = tooltip?.offsetWidth ?? TOOLTIP_WIDTH;
    const tooltipHeight = tooltip?.offsetHeight ?? TOOLTIP_HEIGHT_ESTIMATE;

    const pos = computePosition(targetRect, tooltipWidth, tooltipHeight, preferredPlacement);
    setPosition(pos);
  }, [targetSelector, preferredPlacement, tooltipRef]);

  // Recompute on scroll / resize
  useEffect(() => {
    if (!targetSelector) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial position (deferred to avoid sync setState in effect)
    rafRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetSelector, update]);

  // Recompute after tooltip renders (to get actual height)
  useEffect(() => {
    if (!tooltipRef.current || !targetSelector) return;
    const timer = requestAnimationFrame(update);
    return () => cancelAnimationFrame(timer);
  }, [tooltipRef, targetSelector, update]);

  return position;
}
