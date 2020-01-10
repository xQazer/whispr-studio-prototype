import React from 'react';
import styled from 'styled-components';
import { useDragDispatch, useDragState, isEventAppendMode } from './Providers/DragProvider';

const SelectionBox = styled.div`
  border: 1px dashed #000;
  position: absolute;
  z-index: 1000;
`

const RootDefault = styled.div`
  position: relative;
`


const SelectableContainer = React.forwardRef((props, ref) => {

  const dragState = useDragState();
  const dragDispatch = useDragDispatch();

  const { onAdd, onRemove, onHighlightBegin, onHighlightEnd } = props;
  React.useEffect(() => {
    dragDispatch({ type: 'SET_CONTAINER', payload: { ref, onAdd, onRemove, onHighlightBegin, onHighlightEnd } });
  }, [onAdd, onRemove, onHighlightBegin, onHighlightEnd]);

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

  const {styledRoot, itemProps, ...rest} = props;

  const Root = styledRoot || RootDefault;

  return (
    <Root {...rest} ref={ref} style={{position:'relative'}} onMouseDown={onMouseDown}>
      {props.children}
    </Root>
  )
})

export default SelectableContainer;