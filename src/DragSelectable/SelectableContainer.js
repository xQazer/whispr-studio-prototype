import React from 'react';
import styled from 'styled-components';
import { isEventAppendMode, useDragContext } from './Providers/DragProvider';

const RootDefault = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const SelectableContainer = React.forwardRef((props, ref) => {

  const [dragState, dragDispatch] = useDragContext();

  const { noSelection, styledRoot, onAdd, onRemove, onHighlightChange, priority, ...rest } = props;

  const lastHighlightedState = React.useRef();
  const highlighted = dragState.highlighted === ref;

  if(lastHighlightedState.current !== highlighted){
    typeof onHighlightChange === 'function' && onHighlightChange(highlighted);
    lastHighlightedState.current = highlighted;
  }

  React.useEffect(() => {
    dragDispatch({ type: 'SET_CONTAINER', payload: { ref, onAdd, onRemove, priority } });
  }, [onAdd, onRemove, priority]);

  React.useEffect(()=>{
    return () => {
      dragDispatch({ type: 'REMOVE_CONTAINER', payload: ref });
    }
  },[])

  const onMouseDown = e => {

    if(e.target.classList.contains('drag-handle')){
      return;
    }

    if(e.button === 2 || e.nativeEvent.which === 2){
      return;
    }

    const appendMode = isEventAppendMode(e);
    dragDispatch({ type: 'BEGIN_SELECTION', payload: { appendMode, point: { x: e.pageX, y: e.pageY }, target: e.target } });
  }

  const Root = styledRoot || RootDefault;

  return (
    <Root {...rest} ref={ref} style={{position:'relative'}} onMouseDown={noSelection ? null : onMouseDown}>
      {props.children}
    </Root>
  )
})

export default SelectableContainer;