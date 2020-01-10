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


const DragSelectable =  props => {

  const ref = React.useRef();
  const childrenItems = Array.isArray(props.children) ? props.children : [props.children];

  const dragState = useDragState();
  const dragDispatch = useDragDispatch();

  const childrenId = childrenItems.map(e => e.key).join('');
  const refs = React.useMemo(() => {
    let obj = {};
    let items = [];
    React.Children.forEach(childrenItems, (child, index) => {
      const key = child.key || index;
      obj[key] = React.createRef();
      items.push({key, ref: obj[key], node: child});
    })
    
    dragDispatch({type:'SET_CONTAINER_ITEMS', payload: {containerRef: ref, items}});

    return obj;
  }, [childrenId]);


  const isDragging = !!dragState.drag;
  const selectedItems = dragState.selected;

  const { onAdd, onRemove, onHighlightBegin, onHighlightEnd } = props;
  React.useEffect(() => {
    dragDispatch({ type: 'SET_CONTAINER', payload: { ref, onAdd, onRemove, onHighlightBegin, onHighlightEnd } });
  }, [onAdd, onRemove, onHighlightBegin, onHighlightEnd]);

  React.useEffect(()=>{
    return () => {
      console.log('REMOVE CONTAINER');
      dragDispatch({ type: 'REMOVE_CONTAINER', payload: ref });
    }
  },[])

  const itemDragStart = e => {
    let itemNode = null;
    let tmpNode = e.target;
    while(!itemNode){
      if(!tmpNode) break;
      if (!tmpNode.classList) continue;
      if (!Object.values(refs).some(ref => {
        return ref.current === tmpNode;
      })) {
        tmpNode = tmpNode.parentNode;
        continue;
      }
      itemNode = tmpNode;
      break;
    }

    const rect = itemNode.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.x,
      y: e.clientY - rect.y
    };

    const draggedItem = Object.entries(refs).find(([key, ref]) => {
      return ref.current === itemNode;
    })

    const draggedItemKey = typeof draggedItem == 'object' && draggedItem[0];
    dragDispatch({ type: 'BEGIN_DRAG', payload: {ref, start: { x: e.pageX, y: e.pageY }, dragOffset: offset, draggedItemKey } });
  }

  const onMouseDown = e => {

    if(e.target.classList.contains('drag-handle')){
      itemDragStart(e);
      return;
    }

    if(e.button === 2 || e.nativeEvent.which === 2){
      return;
    }

    const appendMode = isEventAppendMode(e);
    dragDispatch({ type: 'BEGIN_SELECTION', payload: { appendMode, point: { x: e.pageX, y: e.pageY }, target: e.target } });
  }

  const renderChildren = () => {
    let index = 0;

    return React.Children.map(childrenItems, child => {
      const tmpKey = child.key || String(index++);
      const isSelected = selectedItems.includes(tmpKey);

      const onClick =  e => {
        e.preventDefault();
        if (e.ctrlKey || e.altKey || e.shiftKey) {
          e.stopPropagation();

          if(isSelected){
            dragDispatch({type:'REMOVE_SELECT', payload: tmpKey});
          } else {
            dragDispatch({type:'ADD_SELECT', payload: tmpKey})
          }
          return;
        }

        if(isSelected){
          dragDispatch({type:'REMOVE_SELECT', payload: tmpKey});
        } else {
          dragDispatch({type:'SET_SELECTED', payload: [tmpKey]});
        }
      }

      const isShadow = isSelected && isDragging;

      return React.cloneElement(child, {
        key: tmpKey,
        ref: refs[tmpKey],
        isSelected,
        isShadow,
        onClickCapture: onClick,
      })
    }) 
  }

  const {styledRoot, itemProps, ...rest} = props;

  const Root = styledRoot || RootDefault;

  const children = React.useMemo(renderChildren, [refs, isDragging, selectedItems.join('')]);

  return (
    <Root {...rest} ref={ref} style={{position:'relative'}} onMouseDown={onMouseDown}>
      {children}
    </Root>
  )
}

export default DragSelectable;