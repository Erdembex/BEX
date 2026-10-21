import { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, useWindowDimensions, type KeyboardEvent } from 'react-native';

/** Android'de klavyenin pencereyi küçültmediği kısmı. Kart bu kadar yukarı alınır. */
export function useKeyboardOverlap() {
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [overlap, setOverlap] = useState(0);
  const restingHeight = useRef(height);
  const visible = useRef(false);

  useEffect(() => {
    if (!visible.current) {
      restingHeight.current = Math.max(restingHeight.current, height);
    }
  }, [height]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      visible.current = true;
      setOpen(true);
      if (Platform.OS !== 'android') {
        setOverlap(0);
        return;
      }
      const windowHeight = Dimensions.get('window').height;
      const resized = Math.max(0, restingHeight.current - windowHeight);
      setOverlap(Math.max(0, event.endCoordinates.height - resized));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      visible.current = false;
      restingHeight.current = Dimensions.get('window').height;
      setOpen(false);
      setOverlap(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { open, overlap };
}
