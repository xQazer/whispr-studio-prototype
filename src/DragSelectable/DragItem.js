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


const DragItem =  props => {

  const {containerRef} = props;
  const key = String(props.id);

  const ref = React.useRef();
  const dragState = useDragState();
  const dragDispatch = useDragDispatch();

  const isDragging = !!dragState.drag;
  const selectedItems = dragState.selected;
  const isSelected = selectedItems.includes(key);

  const { onAdd, onRemove, onHighlightBegin, onHighlightEnd } = props;
  React.useEffect(() => {
    dragDispatch({ type: 'SET_CONTAINER', payload: { ref, onAdd, onRemove, onHighlightBegin, onHighlightEnd } });
  }, [onAdd, onRemove, onHighlightBegin, onHighlightEnd]);

  React.useEffect(() => {
    // Apply item to containerRef
    // const {key, ref, containerRef, node} = action.payload;
    dragDispatch({type:'ADD_CONTAINER_ITEM', payload: {key: key, ref, containerRef, node: props.children}});
    return () => {
      dragDispatch({type:'REMOVE_CONTAINER_ITEM', payload: key});
    }
  }, [props.children]);

  const itemDragStart = e => {

    const rect = ref.current.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.x,
      y: e.clientY - rect.y
    };

    dragDispatch({ type: 'BEGIN_DRAG', payload: {ref, start: { x: e.pageX, y: e.pageY }, dragOffset: offset, draggedItemKey: key } });
  }

  const onMouseDown = e => {

    if(e.target.classList.contains('drag-handle')){
      itemDragStart(e);
      return;
    }

    // if(e.button === 2 || e.nativeEvent.which === 2){
    //   return;
    // }

    // const appendMode = isEventAppendMode(e);
    // dragDispatch({ type: 'BEGIN_SELECTION', payload: { appendMode, point: { x: e.pageX, y: e.pageY }, target: e.target } });
  }

  const renderChildren = () => {

    const onClick =  e => {
      e.preventDefault();
      if (e.ctrlKey || e.altKey || e.shiftKey) {
        e.stopPropagation();

        if(isSelected){
          dragDispatch({type:'REMOVE_SELECT', payload: key});
        } else {
          dragDispatch({type:'ADD_SELECT', payload: key})
        }
        return;
      }

      if(isSelected){
        dragDispatch({type:'REMOVE_SELECT', payload: key});
      } else {
        dragDispatch({type:'SET_SELECTED', payload: [key]});
      }
    }

    const isShadow = isSelected && isDragging;

    return React.cloneElement(props.children, {
      key: key,
      ref,
      isSelected,
      isShadow,
      onClickCapture: onClick,
    })
  }

  const {styledRoot, itemProps, ...rest} = props;

  const Root = styledRoot || RootDefault;

  const children = React.useMemo(renderChildren, [ref, isDragging, isSelected]);

  return (
    <Root {...rest} ref={ref} style={{position:'relative'}} onMouseDown={onMouseDown}>
      {children}
    </Root>
  )
}

export default DragItem;