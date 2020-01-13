import React from 'react';
import styled from 'styled-components';
import {  isEventAppendMode, useDragContext } from './Providers/DragProvider';

const RootDefault = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`


const DragSelectable =  props => {

  const {noSelection, onHighlightChange, styledRoot, itemProps, ...rest} = props;

  const ref = React.useRef();
  const childrenItems = Array.isArray(props.children) ? props.children : [props.children];

  const [dragState, dragDispatch] = useDragContext();
  // const dragDispatch = useDragDispatch();

  const lastHighlightedState = React.useRef();
  const highlighted = dragState.highlighted === ref;

  if(lastHighlightedState.current !== highlighted){
    typeof onHighlightChange === 'function' && onHighlightChange(highlighted);
    lastHighlightedState.current = highlighted;
  }


  const childrenId = childrenItems.map(e => e.key).join('');
  const refs = React.useMemo(() => {
    let obj = {};
    let items = [];
    React.Children.forEach(childrenItems, (child, index) => {
      const key = child.props.id;
      obj[key] = React.createRef();
      items.push({key, ref: obj[key], node: child});
    })
    
    dragDispatch({type:'SET_CONTAINER_ITEMS', payload: {containerRef: ref, items}});

    return obj;
  }, [childrenId]);


  const isDragging = !!dragState.drag;
  const selectedItems = dragState.selected;

  const { onAdd, onRemove, priority } = props;
  React.useEffect(() => {
    dragDispatch({ type: 'SET_CONTAINER', payload: { ref, onAdd, onRemove, priority } });
  }, [onAdd, onRemove]);

  React.useEffect(()=>{
    return () => {
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

    const draggedItem = Object.values(dragState.items).find(({ref}) => {
      return ref.current === itemNode;
    })

    
    const draggedItemKey = typeof draggedItem == 'object' && draggedItem.key;
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
    return React.Children.map(childrenItems, child => {
      const key = child.props.id;
      const isSelected = selectedItems.includes(key);

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

      return React.cloneElement(child, {
        key: key,
        ref: refs[key],
        isSelected,
        isShadow,
        onClickCapture: onClick,
      })
    }) 
  }

  // const {, ...rest} = props;

  const Root = styledRoot || RootDefault;

  const children = React.useMemo(renderChildren, [refs, isDragging, selectedItems.join('')]);

  return (
    <Root {...rest} ref={ref} style={{position:'relative'}} onMouseDown={noSelection ? null : onMouseDown}>
      {children}
    </Root>
  )
}

export default DragSelectable;