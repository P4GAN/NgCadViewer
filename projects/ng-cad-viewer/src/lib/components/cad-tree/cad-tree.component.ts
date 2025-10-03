import { Component, Input } from '@angular/core';
import { Tree } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { CadNode } from '../../models/cadnode.model';

@Component({
  selector: 'lib-cad-tree',
  imports: [Tree],
  templateUrl: './cad-tree.component.html',
  styleUrl: './cad-tree.component.scss',
})
export class CadTreeComponent {
  @Input() set cadNodes(nodes: CadNode[]) {
    this.treeNodes = nodes.map((cadNode) => this.cadNodeToTreeNode(cadNode));
  }

  treeNodes: TreeNode[] = [];

  private cadNodeToTreeNode(cadNode: CadNode): TreeNode {
    return {
      label: cadNode.name,
      data: {
        selected: cadNode.selected,
        visible: cadNode.visible,
      },
      selectable: true,
      expanded: true,
      children: cadNode.children.map((child) => this.cadNodeToTreeNode(child)),
    };
  }
}
