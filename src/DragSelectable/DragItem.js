import React from 'react';
import styled from 'styled-components';
import { useDragContext } from './Providers/DragProvider';

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
  const key = props.id;

  const ref = React.useRef();
  const [dragState, dragDispatch] = useDragContext();
  // const dragDispatch = useDragDispatch();

  React.useEffect(() => {
    // Apply item to containerRef
    // const {key, ref, containerRef, node} = action.payload;
    dragDispatch({ type: 'ADD_CONTAINER_ITEM', payload: { key: key, ref, containerRef, node: props.children } });
    return () => {
      dragDispatch({ type: 'REMOVE_CONTAINER_ITEM', payload: { key, containerRef } });
    }
  }, []);

  const isDragging = !!dragState.drag;
  const selectedItems = dragState.selected;
  const isSelected = selectedItems.includes(key);

  return React.useMemo(()=>{

    const itemDragStart = e => {

      const node = ref.current;

      const rect = node.getBoundingClientRect();
      const offset = {
        x: e.clientX - rect.x,
        y: e.clientY - rect.y
      };

      dragDispatch({ type: 'BEGIN_DRAG', payload: { ref, start: { x: e.pageX, y: e.pageY }, dragOffset: offset, draggedItemKey: key } });
    }

    const onMouseDown = e => {

      if (e.target.classList.contains('drag-handle')) {
        itemDragStart(e);
        return;
      }
    }

    const renderChildren = () => {

      const onClick = e => {
        e.preventDefault();
        if (e.ctrlKey || e.altKey || e.shiftKey) {
          e.stopPropagation();

          if (isSelected) {
            dragDispatch({ type: 'REMOVE_SELECT', payload: key });
          } else {
            dragDispatch({ type: 'ADD_SELECT', payload: key })
          }
          return;
        }

        if (isSelected) {
          dragDispatch({ type: 'REMOVE_SELECT', payload: key });
        } else {
          dragDispatch({ type: 'SET_SELECTED', payload: [key] });
        }
      }

      const isShadow = isSelected && isDragging;


      return React.cloneElement(props.children, {
        key,
        ref,
        isSelected,
        isShadow,
        onClickCapture: onClick,
      })
    }

    const { styledRoot, itemProps, ...rest } = props;

    const Root = styledRoot || RootDefault;

    // const children = React.useMemo(renderChildren, [ref, isDragging, isSelected]);

    return (
      <Root {...rest} ref={ref} style={{ position: 'relative' }} onMouseDown={onMouseDown}>
        {renderChildren()}
      </Root>
    )
  }, [ref, isDragging, isSelected])
}

export default DragItem;